import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from 'src/users/model/user.model';

export enum FileStatus {
    UNSIGNED = 'unsigned',
    SIGNED = 'signed',
}

@Table
export class File extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    userId: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    filename: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    url: string;

    @Column({
        type: DataType.ENUM(...Object.values(FileStatus)),
        defaultValue: FileStatus.UNSIGNED,
    })
    status: FileStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    generatedAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    signedAt: Date | null;

    @Column({
        type: DataType.DATE,
        defaultValue: DataType.NOW,
    })
    createdAt: Date;

    @Column({
        type: DataType.DATE,
        defaultValue: DataType.NOW,
    })
    updatedAt: Date;
}
