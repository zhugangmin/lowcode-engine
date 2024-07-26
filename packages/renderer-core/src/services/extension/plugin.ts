import { type EventEmitter, type StringDictionary } from '@alilc/lowcode-shared';
import { type IBoosts } from './boosts';
import { ILifeCycleService } from '../lifeCycleService';
import { type ISchemaService } from '../schema';
import { type IPackageManagementService } from '../package';
import { type IStore } from '../../utils/store';

export interface PluginContext<BoostsExtends = object> {
  eventEmitter: EventEmitter;
  globalState: IStore<StringDictionary, string>;
  boosts: IBoosts<BoostsExtends>;
  schema: Pick<ISchemaService, 'get' | 'set'>;
  packageManager: IPackageManagementService;
  /**
   * 生命周期变更事件
   */
  whenLifeCylePhaseChange: ILifeCycleService['when'];
}

export interface Plugin<BoostsExtends = object> {
  /**
   * 插件的 name 作为唯一标识，并不可重复。
   */
  name: string;
  setup(context: PluginContext<BoostsExtends>): void | Promise<void>;
  destory?(): void | Promise<void>;
  dependsOn?: string[];
}
