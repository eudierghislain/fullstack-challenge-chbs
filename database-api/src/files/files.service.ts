import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File, FileStatus } from './model/file.model';
import { RpcException } from '@nestjs/microservices';
import { ErrorMessages } from '../core/enums/error-messages.enum';
import { UserFile } from '../core/interfaces/user-file.interface';

@Injectable()
export class FilesService {

    constructor(
        @InjectModel(File)
        private readonly fileModel: typeof File,
    ) { }

    public async getUserFiles(userId: string) : Promise<File[]> {
        let files = await this.fileModel.findAll({ where: { userId } });
        return files.map( x=> x.dataValues)
    }

    public async createFile(data: UserFile): Promise<File> {
        try {
            const { userId, filename } = data;
            const file = await this.fileModel.create({ userId, filename });
            return file
        } catch (error) {
            console.log(error)
            throw new RpcException(ErrorMessages.ERROR_CREATING_FILE);
        }
    }

    public async updateFile(fileId: string, status: FileStatus): Promise<File> {
        try {
            const file = await this.fileModel.findByPk(fileId);
            if (!file) throw new RpcException(ErrorMessages.FILE_NOT_FOUND);

            if (status === FileStatus.SIGNED) {
                file.signedAt = new Date();
            } else if (status === FileStatus.UNSIGNED) {
                file.signedAt = null;
            }

            file.status = status;
            await file.save();
            return file;
        } catch (error) {
            throw new RpcException(ErrorMessages.ERROR_UPDATING_FILE);
        }
    }

    public async deleteFile(filename: string): Promise<void> {
        try {
            const file = await this.fileModel.findOne({ where: { filename } });
            if (!file) throw new RpcException(ErrorMessages.FILE_NOT_FOUND);

            await file.destroy();

        } catch (error) {
            throw new RpcException(ErrorMessages.ERROR_DELETING_FILE);
        }
    }

    public async markFileAsGenerated(data: UserFile): Promise<File> {
        try {
            const { userId, filename } = data;

            let file = await this.fileModel.findOne({ where: { userId, filename } });

            if (!file) {
                file = await this.fileModel.create({
                    userId,
                    filename,
                    status: FileStatus.UNSIGNED,
                    generatedAt: new Date()
                });
            }

            return file;
        } catch (error) {
            throw new RpcException(ErrorMessages.ERROR_MARKING_FILE_AS_GENERATED);
        }
    }


    public async markFileAsSigned(data: UserFile): Promise<File> {
        try {

            const { userId, filename, url } = data;
            let file = await this.fileModel.findOne({ where: { userId, filename } });

            if (!file) {
                file = await this.fileModel.create({ userId, filename, status: FileStatus.SIGNED, generatedAt: new Date(), signedAt: new Date(), url });
            } else {
                const updatedFile = await file.update({
                    status: FileStatus.SIGNED,
                    signedAt: new Date(),
                    url
                });
            }

            return file;
        } catch (error) {
            console.log(error)
            throw new RpcException(ErrorMessages.ERROR_MARKING_FILE_AS_SIGNED);
        }
    }

}
