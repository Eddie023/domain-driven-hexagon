import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import {
  UserEntity,
  UserProps,
} from 'src/modules/user/domain/entities/user.entity';
import { NotFoundException } from '@exceptions';
import {
  TypeormRepositoryBase,
  WhereCondition,
} from 'src/infrastructure/database/base-classes/typeorm.repository.base';
import { QueryParams } from 'src/core/ports/repository.ports';
import { UserOrmEntity } from './user.orm-entity';
import { UserRepositoryPort } from './user.repository.interface';
import { UserOrmMapper } from './user.orm-mapper';
import { FindUsersQuery } from '../queries/find-users/find-users.query';

@Injectable()
export class UserRepository
  extends TypeormRepositoryBase<UserEntity, UserProps, UserOrmEntity>
  implements UserRepositoryPort {
  protected relations: string[] = [];

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {
    super(
      userRepository,
      new UserOrmMapper(UserEntity, UserOrmEntity),
      new Logger('user-repository'),
    );
  }

  private async findOneByEmail(
    email: string,
  ): Promise<UserOrmEntity | undefined> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user;
  }

  async findOneByEmailOrThrow(email: string): Promise<UserEntity> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException();
    }
    return this.mapper.toDomainEntity(user);
  }

  async exists(email: string): Promise<boolean> {
    const found = await this.findOneByEmail(email);
    if (found) {
      return true;
    }
    return false;
  }

  async findUsers(query: FindUsersQuery): Promise<UserEntity[]> {
    const users = await this.repository.find({ where: query });

    return users.map(user => this.mapper.toDomainEntity(user));
  }

  // Used to construct a query
  protected prepareQuery(
    params: QueryParams<UserProps>,
  ): WhereCondition<UserOrmEntity> {
    const where: QueryParams<UserOrmEntity> = {};
    if (params.id) {
      where.id = params.id.value;
    }
    if (params.createdAt) {
      where.createdAt = params.createdAt.value;
    }
    if (params.address?.country) {
      where.country = params.address.country;
    }
    if (params.address?.street) {
      where.street = params.address.street;
    }
    if (params.address?.postalCode) {
      where.postalCode = params.address.postalCode;
    }
    return where;
  }
}
