import io
import json
from typing import Dict, List

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from .base import FileProcessor
from ..core.config import PROCESSOR_REGISTRY


class GoogleDriveProcessor(FileProcessor):
    async def process(self, file_ids: List[str], credentials_json: str) -> List[Dict]:
        try:
            credentials = Credentials.from_authorized_user_info(json.loads(credentials_json))
            drive_service = build('drive', 'v3', credentials=credentials)
            results = []

            async def process_file(file_id: str):
                file_metadata = drive_service.files().get(fileId=file_id, fields="id,name,mimeType").execute()
                file_name = file_metadata['name']
                file_size = int(file_metadata.get('size', 0))
                mime_type = file_metadata['mimeType']

                if mime_type == "application/vnd.google-apps.folder":
                    # Recursively process folder contents
                    page_token = None
                    while True:
                        query = f"'{file_id}' in parents and trashed=false"
                        folder_results = drive_service.files().list(
                            q=query,
                            fields="nextPageToken, files(id, name, mimeType)",
                            pageToken=page_token
                        ).execute()
                        folder_files = folder_results.get('files', [])
                        for folder_file in folder_files:
                            await process_file(folder_file['id'])
                        page_token = folder_results.get('nextPageToken')
                        if not page_token:
                            break
                else:
                    # Process individual file
                    request = drive_service.files().get_media(fileId=file_id)
                    file_io = io.BytesIO()
                    downloader = MediaIoBaseDownload(file_io, request)
                    done = False
                    while not done:
                        status, done = downloader.next_chunk()
                    file_content = file_io.getvalue()
                    processor = PROCESSOR_REGISTRY.get(mime_type)
                    if not processor:
                        results.append({"filename": file_name, "error": f"Unsupported file type: {mime_type}"})
                        return
                    result = await processor.process(file_content, file_name)
                    results.append(result)

            # Process all provided file/folder IDs
            for file_id in file_ids:
                await process_file(file_id)

            return results
        except Exception as e:
            return [{"filename": "google_drive_files", "error": f"Failed to process Google Drive files: {str(e)}"}]