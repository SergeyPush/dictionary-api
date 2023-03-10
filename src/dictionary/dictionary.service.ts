import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dictionary } from './entity/dictionary.entity';
import { ILike, MoreThan, Not, Repository } from 'typeorm';
import { DictionaryDto } from './dto/dictionary.dto';
import { User } from '../user/entities/user.entity';
import { DICTIONARY_NOT_FOUND } from './dictionary.constants';

@Injectable()
export class DictionaryService {
  constructor(
    @InjectRepository(Dictionary)
    private readonly dictionaryRepository: Repository<Dictionary>,
  ) {}

  async createDictionary(dictionaryDto: DictionaryDto, user: User) {
    const dictionary = this.dictionaryRepository.create({
      name: dictionaryDto.name,
      isPublic: dictionaryDto.isPublic,
      user,
    });

    await this.dictionaryRepository.save(dictionary);
    return this.getOnlyDictionary(dictionary.id);
  }

  async getAllDictionaries(user: User) {
    return this.dictionaryRepository.find({
      where: { user },
      order: { updatedAt: 'DESC' },
      // relations: ['words'],
    });
  }

  async findOneDictionary(dictionaryId: number, user: User) {
    const dict = await this.dictionaryRepository.findOne({
      where: {
        id: dictionaryId,
        user,
      },
      relations: ['words'],
    });
    if (!dict) {
      throw new NotFoundException(DICTIONARY_NOT_FOUND);
    }

    return dict;
  }

  async getOnlyDictionary(dictionaryId: number) {
    return this.dictionaryRepository.findOne({
      where: {
        id: dictionaryId,
      },
    });
  }

  async updateSingleDictionary(
    dictionaryId: number,
    dictionaryDto: DictionaryDto,
    user: User,
  ) {
    const dict = await this.findOneDictionary(dictionaryId, user);
    dict.name = dictionaryDto.name;
    return this.dictionaryRepository.save(dict);
  }

  async deleteDictionary(dictionaryId: number, user: User) {
    const dict = await this.findOneDictionary(dictionaryId, user);
    await this.dictionaryRepository.remove(dict);
    return { success: true };
  }

  async changePrivacy(dictionaryId: number, user: User) {
    const dict = await this.findOneDictionary(dictionaryId, user);
    dict.isPublic = !dict.isPublic;
    return this.dictionaryRepository.save(dict);
  }

  async getAllPublicDictionaries(
    page: number,
    limit: number,
    user?: User,
    name?: string,
  ) {
    const skip = (page - 1) * limit;
    const [dictionaries, count] = await this.dictionaryRepository.findAndCount({
      where: [
        {
          isPublic: true,
          ...(user && { user: { id: Not(user.id) } }),
          ...(name && { name: ILike(`%${name}%`) }),
        },
        { words: MoreThan(0) },
      ],
      skip,
      take: limit,
      order: {
        updatedAt: 'DESC',
      },
    });
    return {
      dictionaries,
      count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    };
  }

  async findPublicDictionary(dictionaryId) {
    const dict = await this.dictionaryRepository.findOne({
      where: {
        isPublic: true,
        id: dictionaryId,
      },
      relations: ['words'],
    });
    if (!dict) {
      throw new NotFoundException(DICTIONARY_NOT_FOUND);
    }
    return dict;
  }

  async searchDictionary(therm: string, user?: User, isPublic?: boolean) {
    const dict = await this.dictionaryRepository.find({
      where: {
        name: ILike(`%${therm}%`),
        ...(isPublic && {
          isPublic: isPublic,
        }),
        ...(user && { user: { id: Not(user.id) } }),
      },
    });

    if (!dict) {
      throw new NotFoundException(DICTIONARY_NOT_FOUND);
    }
    return dict;
  }
}
