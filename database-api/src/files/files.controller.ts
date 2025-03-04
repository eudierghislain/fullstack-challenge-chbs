import { Controller, Get, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilesService } from './files.service';
import { TCPMessages } from 'src/core/enums/tcp-message.enum';
import { FileStatus } from './model/file.model';
import { UserFile } from 'src/core/interfaces/user-file.interface';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { UserId } from 'src/core/decorators/userid.decorator';

@Controller('files')
export class FilesController {

    constructor(
        private readonly filesService: FilesService
    ) { }

    @UseGuards(AuthGuard)
    @Get()
    public getUserFiles(
        @UserId() userId: string
    ) {
        return this.filesService.getUserFiles(userId);
    }

    @MessagePattern(TCPMessages.FILE_SIGNED)
    public markFileAsSigned(
        @Payload() data: UserFile
    ) {
        return this.filesService.markFileAsSigned(data);
    }

    @MessagePattern(TCPMessages.FILE_GENERATED)
    public markFileAsGenerated(
        @Payload() data: UserFile
    ) {
        return this.filesService.markFileAsGenerated(data);
    }

    @MessagePattern(TCPMessages.FILE_CREATED)
    public fileCreated(
        @Payload() data: UserFile
    ) {
        return this.filesService.createFile(data);
    }

    @MessagePattern(TCPMessages.FILE_UPDATED)
    public fileUpdated(
        @Payload() data: { fileId: string; status: FileStatus }
    ) {
        return this.filesService.updateFile(data.fileId, data.status);
    }

    @MessagePattern(TCPMessages.FILE_DELETED)
    public fileDeleted(
        @Payload() data: { fileId: string }
    ) {
        return this.filesService.deleteFile(data.fileId);
    }

}
