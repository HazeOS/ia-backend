import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { IUsersRepository } from './interfaces/users-repository.interface';

export class UsersRepository
  implements IUsersRepository<User, CreateUserDto, UpdateUserDto>
{
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createDto: CreateUserDto): Promise<User> {
    return await this.userModel.create(createDto);
  }

  async findAll(): Promise<User[]> {
    return await this.userModel
      .find()
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .exec();
  }

  async findOne(filter: FilterQuery<User>): Promise<User> {
    return await this.userModel
      .findOne(filter)
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .exec();
  }

  async findOneById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Incorrect ID');
    }

    const user = await this.userModel
      .findById(id)
      .populate({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    return Promise.resolve(undefined);
  }

  async remove(id: string): Promise<User> {
    return Promise.resolve(undefined);
  }
}
