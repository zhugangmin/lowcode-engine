import { Disposable, Events } from '@alilc/lowcode-shared';
import { IWindowState, IEditWindow, IWindowConfiguration } from './window';
import { IFileService } from '../file';
import { Registry, Extensions } from '../extension/registry';
import { IContentEditorRegistry } from '../contentEditor/contentEditorRegistry';
import { IContentEditor } from '../contentEditor/contentEditor';

export interface IWindowCreationOptions {
  readonly state: IWindowState;
}

export class EditWindow extends Disposable implements IEditWindow {
  private readonly _onWillLoad = this._addDispose(new Events.Emitter<void>());
  onWillLoad = this._onWillLoad.event;

  private readonly _onDidSignalReady = this._addDispose(new Events.Emitter<void>());
  onDidSignalReady = this._onDidSignalReady.event;

  private readonly _onDidClose = this._addDispose(new Events.Emitter<void>());
  onDidClose = this._onDidClose.event;

  private readonly _onDidDestroy = this._addDispose(new Events.Emitter<void>());
  onDidDestroy = this._onDidDestroy.event;

  private _id: number;
  get id(): number {
    return this._id;
  }

  private _windowState: IWindowState;

  private readonly _whenReadyCallbacks: ((window: IEditWindow) => void)[] = [];

  private _readyState: boolean;
  get isReady(): boolean {
    return this._readyState;
  }

  private _lastFocusTime;
  get lastFocusTime(): number {
    return this._lastFocusTime;
  }

  private _config: IWindowConfiguration | undefined;
  get config(): IWindowConfiguration | undefined {
    return this._config;
  }

  constructor(
    options: IWindowCreationOptions,
    @IFileService private readonly fileService: IFileService,
  ) {
    super();

    this._windowState = options.state;

    this._id = 0;

    this._lastFocusTime = Date.now();
  }

  ready(): Promise<IEditWindow> {
    return new Promise<IEditWindow>((resolve) => {
      if (this.isReady) {
        return resolve(this);
      }

      // otherwise keep and call later when we are ready
      this._whenReadyCallbacks.push(resolve);
    });
  }

  private setReady(): void {
    this._readyState = true;

    // inform all waiting promises that we are ready now
    while (this._whenReadyCallbacks.length) {
      this._whenReadyCallbacks.pop()!(this);
    }
  }

  async load(config: IWindowConfiguration): Promise<void> {
    const { fileToOpenOrCreate, contentType } = config;
    const { exists, fileUri } = fileToOpenOrCreate;

    const contentEditor = Registry.as<IContentEditorRegistry>(Extensions.ContentEditor).getContentEditor(contentType);

    if (!contentEditor) {
      throw Error('content editor not found');
    }

    let content: string = '';

    const fs = this.fileService.withProvider(fileToOpenOrCreate.fileUri)!;
    if (!exists) {
      await fs.writeFile(fileUri, content);
    } else {
      content = await fs.readFile(fileUri);
    }

    contentEditor.load(content);

    this._onWillLoad.notify();

    this._config = config;

    this.setReady();
  }

  async reload(): Promise<void> {
    await this.destory();
    return this.load(this._config!);
  }

  focus(): void {}

  close(): void {}

  async destory(): Promise<void> {}

  sendWhenReady(channel: string, ...args: any[]): void {
    if (this.isReady) {
      this.send(channel, ...args);
    } else {
      this.ready().then(() => {
        this.send(channel, ...args);
      });
    }
  }

  private send(channel: string, ...args: any[]): void {
    // todo
  }
}
