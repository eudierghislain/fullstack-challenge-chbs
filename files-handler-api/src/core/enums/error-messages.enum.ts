export enum ErrorMessages {
    FILE_NOT_FOUND = 'File not found',
    PDF_ONLY = 'Only PDF files are accepted',
    NO_FILE_PROVIDED = 'No file provided',
    ERROR_LISTING_FILES = 'Error while listing files',
    ERROR_GENERATION_URL = 'Error while generating the URL',
    ERROR_DELETE = 'Error while deleting the file',
    ERROR_UPLOAD = 'Error while uploading file',
    ERROR_CONFIGURING_MINIO = 'Error configuring Minio client',
    ERROR_BUCKET_INIT = 'Error during bucket initialization',
    USER_NOT_FOUND = 'User not found',
    UNABLE_TO_SIGN = 'Unable to sign document',
    UNABLE_TO_GENERATE = 'Unable to generate'
}
