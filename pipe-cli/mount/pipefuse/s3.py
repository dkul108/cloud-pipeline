# Copyright 2017-2019 EPAM Systems, Inc. (https://www.epam.com/)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import logging
import os

import time
from datetime import datetime

import pytz
from boto3 import Session
from botocore.config import Config
from botocore.credentials import RefreshableCredentials
from botocore.session import get_session

import fuseutils
from fsclient import File, FileSystemClient
from fuseutils import MB, GB
from mpu import MultipartUpload, SplittingMultipartCopyUpload, ChunkedMultipartUpload

_ANY_ERROR = Exception


def _http_range(start, end):
    return 'bytes=%s-%s' % (start, end - 1)


class S3MultipartUpload(MultipartUpload):

    def __init__(self, path, offset, bucket, s3):
        """
        Plain multipart upload.

        :param path: Destination bucket relative path.
        :param offset: First upload part offset.
        :param bucket: Destination bucket name.
        :param s3: Boto S3 client.
        """
        self._path = path
        self._bucket = bucket
        self._s3 = s3
        self._upload_id = None
        self._parts = {}
        self._offset = offset

    @property
    def path(self):
        return self._path

    def initiate(self):
        response = self._s3.create_multipart_upload(
            Bucket=self._bucket,
            Key=self._path
        )
        self._upload_id = response['UploadId']

    def upload_part(self, buf, offset=None, part_number=None):
        with io.BytesIO(buf) as body:
            response = self._s3.upload_part(
                Bucket=self._bucket,
                Key=self._path,
                Body=body,
                UploadId=self._upload_id,
                PartNumber=part_number
            )
        self._parts[part_number] = response['ETag']

    def upload_copy_part(self, start, end, offset=None, part_number=None):
        response = self._s3.upload_part_copy(
            Bucket=self._bucket,
            Key=self._path,
            CopySource={
                'Bucket': self._bucket,
                'Key': self._path,
            },
            CopySourceRange=_http_range(start, end),
            UploadId=self._upload_id,
            PartNumber=part_number
        )
        self._parts[part_number] = response['CopyPartResult']['ETag']

    def complete(self):
        self._s3.complete_multipart_upload(
            Bucket=self._bucket,
            Key=self._path,
            MultipartUpload={
                'Parts': [
                    {
                        'ETag': self._parts[part_number],
                        'PartNumber': part_number
                    } for part_number in sorted(self._parts.keys())
                ]
            },
            UploadId=self._upload_id
        )

    def abort(self):
        logging.error('Aborting multipart upload for %s' % self._path)
        self._s3.abort_multipart_upload(Bucket=self._bucket, Key=self._path, UploadId=self._upload_id)


class S3Client(FileSystemClient):

    def __init__(self, bucket, pipe, chunk_size):
        """
        AWS S3 API client for single bucket operations.

        :param bucket: Name of the AWS S3 bucket.
        :param pipe: Cloud Pipeline API client.
        :param chunk_size: Multipart upload chunk size.
        """
        super(S3Client, self).__init__()
        self._is_read_only = False
        self.bucket = bucket
        self._s3 = self._generate_s3_client(bucket, pipe)
        self._chunk_size = chunk_size
        self._delimiter = '/'
        self._single_upload_size = 5 * MB
        self._mpus = {}
        self.root_path = '/'

    def _generate_s3_client(self, bucket, pipe):
        session = self._generate_aws_session(bucket, pipe)
        return session.client('s3', config=Config())

    def _generate_aws_session(self, bucket, pipe):
        def refresh():
            bucket_object = pipe.get_storage(bucket)
            credentials = pipe.get_temporary_credentials(bucket_object)
            return dict(
                access_key=credentials.access_key_id,
                secret_key=credentials.secret_key,
                token=credentials.session_token,
                expiry_time=credentials.expiration,
                region_name=credentials.region,
                write_allowed=bucket_object.is_write_allowed())

        fresh_metadata = refresh()

        self._is_read_only = not fresh_metadata['write_allowed']

        session_credentials = RefreshableCredentials.create_from_metadata(
            metadata=fresh_metadata,
            refresh_using=refresh,
            method='sts-assume-role')

        s = get_session()
        s._credentials = session_credentials
        return Session(botocore_session=s, region_name=fresh_metadata['region_name'])

    def is_available(self):
        # TODO 05.09.2019: Check AWS API for availability
        return True

    def is_read_only(self):
        return self._is_read_only

    def exists(self, path):
        return len(self.ls(path)) > 0

    def ls(self, path, depth=1):
        paginator = self._s3.get_paginator('list_objects_v2')
        prefix = (path or '').lstrip(self._delimiter)
        recursive = depth < 0
        operation_parameters = {
            'Bucket': self.bucket
        }
        if prefix:
            operation_parameters['Prefix'] = prefix
        if not recursive:
            operation_parameters['Delimiter'] = self._delimiter
        page_iterator = paginator.paginate(**operation_parameters)
        items = []
        for page in page_iterator:
            if 'CommonPrefixes' in page:
                for folder in page['CommonPrefixes']:
                    name = S3Client.get_item_name(folder['Prefix'], prefix=prefix)
                    items.append(self.get_folder_object(name))
            if 'Contents' in page:
                for file in page['Contents']:
                    if not file['Key'].endswith(self._delimiter):
                        name = self.get_file_name(file, prefix, recursive)
                        item = self.get_file_object(file, name)
                        items.append(item)
            break
        return items if path.endswith(self._delimiter) else self._matching_paths(items, path)

    def _matching_paths(self, items, path):
        _, file_name = fuseutils.split_path(path)
        return [item for item in items if item.name.rstrip(self._delimiter) == file_name]

    @classmethod
    def get_item_name(cls, path, prefix, delimiter='/'):
        possible_folder_name = prefix if prefix.endswith(delimiter) else \
            prefix + delimiter
        if prefix and path.startswith(prefix) and path != possible_folder_name and path != prefix:
            if not path == prefix:
                splitted = prefix.split(delimiter)
                return splitted[len(splitted) - 1] + path[len(prefix):]
            else:
                return path[len(prefix):]
        elif not path.endswith(delimiter) and path == prefix:
            return os.path.basename(path)
        elif path == possible_folder_name:
            return os.path.basename(path.rstrip(delimiter)) + delimiter
        else:
            return path

    def get_folder_object(self, name):
        return File(name=name,
                    size=0,
                    mtime=time.mktime(datetime.now(tz=pytz.utc).timetuple()),
                    ctime=None,
                    contenttype='',
                    is_dir=True)

    def get_file_name(self, file, prefix, recursive):
        return file['Key'] if recursive else S3Client.get_item_name(file['Key'], prefix=prefix)

    def get_file_object(self, file, name):
        return File(name=name,
                    size=file.get('Size', ''),
                    mtime=time.mktime(file['LastModified'].astimezone(pytz.utc).timetuple()),
                    ctime=None,
                    contenttype='',
                    is_dir=False)

    def upload(self, buf, path):
        destination_path = path.lstrip(self._delimiter)
        with io.BytesIO(bytearray(buf)) as body:
            self._s3.put_object(Bucket=self.bucket, Key=destination_path, Body=body)

    def delete(self, path):
        source_path = path.lstrip(self._delimiter)
        self._s3.delete_object(Bucket=self.bucket, Key=source_path)

    def mv(self, old_path, path):
        source_path = old_path.lstrip(self._delimiter)
        destination_path = path.lstrip(self._delimiter)
        folder_source_path = fuseutils.append_delimiter(source_path)
        if self.exists(folder_source_path):
            self._mvdir(folder_source_path, destination_path)
        else:
            self._mvfile(source_path, destination_path)

    def _mvdir(self, folder_source_path, folder_destination_path):
        for file in self.ls(fuseutils.append_delimiter(folder_source_path), depth=-1):
            relative_path = fuseutils.without_prefix(file.name, folder_source_path)
            destination_path = fuseutils.join_path_with_delimiter(folder_destination_path, relative_path)
            self._mvfile(file.name, destination_path)

    def _mvfile(self, source_path, destination_path):
        source = {
            'Bucket': self.bucket,
            'Key': source_path
        }
        self._s3.copy(source, self.bucket, destination_path)
        self._s3.delete_object(**source)

    def mkdir(self, path):
        folder_path = path.lstrip(self._delimiter)
        synthetic_file_path = fuseutils.join_path_with_delimiter(folder_path, '.DS_Store')
        self.upload([], synthetic_file_path)

    def rmdir(self, path):
        for file in self.ls(fuseutils.append_delimiter(path), depth=-1):
            self.delete(file.name)

    def download_range(self, fh, buf, path, offset=0, length=0):
        source_path = path.lstrip(self._delimiter)
        source = {
            'Bucket': self.bucket,
            'Key': source_path
        }
        if offset >= 0 and length >= 0:
            source['Range'] = _http_range(offset, offset + length)
        response = self._s3.get_object(**source)
        self._download(buf, response['Body'])

    def _download(self, buf, response):
        for chunk in iter(lambda: response.read(1 * MB), b''):
            buf.write(chunk)

    def upload_range(self, fh, buf, path, offset=0):
        source_path = path.lstrip(self._delimiter)
        mpu = self._mpus.get(path, None)
        try:
            if not mpu:
                file_size = self.attrs(path).size
                buf_size = len(buf)
                if buf_size < self._single_upload_size and file_size < self._single_upload_size:
                    self._upload_single_range(fh, buf, source_path, offset)
                else:
                    mpu = self._new_mpu(file_size, offset, source_path)
                    self._mpus[path] = mpu
                    mpu.initiate()
                    mpu.upload_part(buf, offset)
            else:
                mpu.upload_part(buf, offset)
        except _ANY_ERROR:
            if mpu:
                mpu.abort()
                del self._mpus[path]
            raise

    def _new_mpu(self, file_size, offset, source_path):
        mpu = S3MultipartUpload(source_path, offset, self.bucket, self._s3)
        mpu = SplittingMultipartCopyUpload(mpu, min_part_size=5 * MB, max_part_size=5 * GB)
        mpu = ChunkedMultipartUpload(mpu, file_size, download_func=self._generate_region_download_function(source_path),
                                     chunk_size=self._chunk_size, min_chunk=1, max_chunk=10000)
        return mpu

    def _generate_region_download_function(self, path):
        def download_func(region_offset, region_length):
            with io.BytesIO() as buf:
                self.download_range(None, buf, path, region_offset, region_length)
                return buf.getvalue()
        return download_func

    def _upload_single_range(self, fh, buf, path, offset):
        with io.BytesIO() as original_buf:
            self.download_range(fh, original_buf, path)
            modified_bytes = bytearray(original_buf.getvalue())
        modified_bytes[offset: offset + len(buf)] = buf
        with io.BytesIO(modified_bytes) as body:
            self._s3.put_object(Bucket=self.bucket, Key=path, Body=body)

    def flush(self, fh, path):
        mpu = self._mpus.get(path, None)
        if mpu:
            try:
                mpu.complete()
            except _ANY_ERROR:
                mpu.abort()
                raise
            finally:
                del self._mpus[path]
