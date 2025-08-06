import { MlCommonsPluginSettings } from '../../domain/entities/plugin-settings';
import { CreateMLCommonsDto } from '../dtos/create-ml-commons-dto';

export interface MLCommonsSettingsRepository {
  persist(dto: CreateMLCommonsDto): Promise<boolean>;
  retrieve(): Promise<any>;
}
