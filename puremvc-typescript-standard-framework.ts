export interface ICommand
  extends INotifier {
  execute(notification: INotification): void;
}

export interface IController {
  executeCommand(notification: INotification): void;
  registerCommand(notificationName: string, commandClassRef: Function): void;
  hasCommand(notificationName: string): boolean;
  removeCommand(notificationName: string): void;
}

export interface IFacade
  extends INotifier {
  registerCommand(notificationName: string, commandClassRef: Function): void;
  removeCommand(notificationName: string): void;
  hasCommand(notificationName: string): boolean;
  registerProxy(proxy: IProxy): void;
  retrieveProxy(proxyName: string): IProxy;
  removeProxy(proxyName: string): IProxy;
  hasProxy(proxyName: string): boolean;
  registerMediator(mediator: IMediator): void;
  retrieveMediator(mediatorName: string): IMediator;
  removeMediator(mediatorName: string): IMediator;
  hasMediator(mediatorName: string): boolean;
  notifyObservers(notification: INotification): void;
}

export interface IMediator
  extends INotifier {
  getMediatorName(): string;
  getViewComponent(): any;
  setViewComponent(viewComponent: any): void;
  listNotificationInterests(): string[];
  handleNotification(notification: INotification): void;
  onRegister(): void;
  onRemove(): void;
}

export interface IModel {
  registerProxy(proxy: IProxy): void;
  removeProxy(proxyName: string): IProxy;
  retrieveProxy(proxyName: string): IProxy;
  hasProxy(proxyName: string): boolean;
}

export interface INotification {
  getName(): string;
  setBody(body: any): void;
  getBody(): any;
  setType(type: string): void;
  getType(): string;
  toString(): string;
}

export interface INotifier {
  sendNotification(name: string, body?: any, type?: string): void;
}

export interface IObserver {
  setNotifyMethod(notifyMethod: Function): void;
  setNotifyContext(notifyContext: any): void;
  notifyObserver(notification: INotification): void;
  compareNotifyContext(object: any): boolean;
}

export interface IProxy
  extends INotifier {
  getProxyName(): string;
  setData(data: any): void;
  getData(): any;
  onRegister(): void;
  onRemove(): void;
}

export interface IView {
  registerObserver(notificationName: string, observer: IObserver): void;
  removeObserver(notificationName: string, notifyContext: any): void;
  notifyObservers(notification: INotification): void;
  registerMediator(mediator: IMediator): void;
  retrieveMediator(mediatorName: string): IMediator;
  removeMediator(mediatorName: string): IMediator;
  hasMediator(mediatorName: string): boolean;
}









export class Observer
  implements IObserver {
  public notify: Function;
  public context: any;
  constructor(notifyMethod: Function, notifyContext: any) {
    this.notify = null;
    this.context = null;
    this.setNotifyMethod(notifyMethod);
    this.setNotifyContext(notifyContext);
  };
  private getNotifyMethod(): Function {
    return this.notify;
  };
  public setNotifyMethod(notifyMethod: Function): void {
    this.notify = notifyMethod;
  };
  private getNotifyContext(): any {
    return this.context;
  };
  public setNotifyContext(notifyContext: any): void {
    this.context = notifyContext;
  };
  public notifyObserver(notification: INotification): void {
    // console.log("[mvcFrame:notifyObserver] notifyMethod!=null:"+!!this.getNotifyMethod());
    this.getNotifyMethod().call(this.getNotifyContext(), notification);
  };
  public compareNotifyContext(object: any): boolean {
    return object === this.context;
  };
}

export class View
  implements IView {
  public mediatorMap: Object;
  public observerMap: Object;
  constructor() {
    this.mediatorMap = null;
    this.observerMap = null;
    if (View.instance) {
      throw Error(View.SINGLETON_MSG);
    }
    View.instance = this;
    this.mediatorMap = {
    };
    this.observerMap = {
    };
    this.initializeView();
  };
  public initializeView(): void { };
  public registerObserver(notificationName: string, observer: IObserver): void {
    var observers = this.observerMap[notificationName];
    if (observers) {
      observers.push(observer);
    } else {
      this.observerMap[notificationName] = [
        observer
      ];
    }
  };
  public removeObserver(notificationName: string, notifyContext: any): void {
    var observers = this.observerMap[notificationName];
    var i = observers.length;
    while (i--) {
      var observer = observers[i];
      if (observer.compareNotifyContext(notifyContext)) {
        observers.splice(i, 1);
        break;
      }
    }
    if (observers.length == 0) {
      delete this.observerMap[notificationName];
    }
  };
  public notifyObservers(notification: INotification): void {
    var notificationName = notification.getName();
    // console.log("[mvcFrame:notifyObservers] notificationName:"+notificationName);
    // console.log("[mvcFrame:notifyObservers] curObserversArr:"+Object.keys(this.observerMap));
    var observersRef = this.observerMap[notificationName];
    if (observersRef) {
      var observers = observersRef.slice(0);
      // console.log("[mvcFrame:notifyObservers] observers.length:"+observers.length);
      var len = observers.length;
      for (var i = 0; i < len; i++) {
        var observer = observers[i];
        observer.notifyObserver(notification);
      }
    }
  };
  public registerMediator(mediator: IMediator): void {
    var name = mediator.getMediatorName();
    if (this.mediatorMap[name]) {
      return;
    }
    this.mediatorMap[name] = mediator;
    var interests = mediator.listNotificationInterests();
    var len = interests.length;
    if (len > 0) {
      var observer = new Observer(mediator.handleNotification, mediator);
      for (var i = 0; i < len; i++) {
        this.registerObserver(interests[i], observer);
      }
    }
    mediator.onRegister();
  };
  public retrieveMediator(mediatorName: string): IMediator {
    return this.mediatorMap[mediatorName] || null;
  };
  public removeMediator(mediatorName: string): IMediator {
    var mediator = this.mediatorMap[mediatorName];
    if (!mediator) {
      return null;
    }
    var interests = mediator.listNotificationInterests();
    var i = interests.length;
    while (i--) {
      this.removeObserver(interests[i], mediator);
    }
    delete this.mediatorMap[mediatorName];
    mediator.onRemove();
    return mediator;
  };
  public hasMediator(mediatorName: string): boolean {
    return this.mediatorMap[mediatorName] != null;
  };
  static SINGLETON_MSG: string;
  static instance: IView;
  static getInstance(): IView {
    if (!View.instance) {
      View.instance = new View();
    }
    return View.instance;
  };
}


export class Controller
  implements IController {
  public view: IView;
  public commandMap: Object;
  constructor() {
    this.view = null;
    this.commandMap = null;
    if (Controller.instance) {
      throw Error(Controller.SINGLETON_MSG);
    }
    Controller.instance = this;
    this.commandMap = {
    };
    this.initializeController();
  };
  public initializeController(): void {
    this.view = View.getInstance();
  };
  public executeCommand(notification: INotification): void {
    var commandClassRef = this.commandMap[notification.getName()];
    if (commandClassRef) {
      var command = new commandClassRef();
      command.execute(notification);
    }
  };
  public registerCommand(notificationName: string, commandClassRef: Function): void {
    if (!this.commandMap[notificationName]) {
      this.view.registerObserver(notificationName, new Observer(this.executeCommand, this));
    }
    this.commandMap[notificationName] = commandClassRef;
  };
  public hasCommand(notificationName: string): boolean {
    return this.commandMap[notificationName] != null;
  };
  public removeCommand(notificationName: string): void {
    if (this.hasCommand(notificationName)) {
      this.view.removeObserver(notificationName, this);
      delete this.commandMap[notificationName];
    }
  };
  static instance: IController = null;
  static SINGLETON_MSG: string = "Controller singleton already constructed!";
  static getInstance(): IController {
    if (!Controller.instance) {
      Controller.instance = new Controller();
    }
    return Controller.instance;
  };
}

export class Model
  implements IModel {
  public proxyMap: Object;
  constructor() {
    this.proxyMap = null;
    if (Model.instance) {
      throw Error(Model.SINGLETON_MSG);
    }
    Model.instance = this;
    this.proxyMap = {
    };
    this.initializeModel();
  };
  public initializeModel(): void { };
  public registerProxy(proxy: IProxy): void {
    this.proxyMap[proxy.getProxyName()] = proxy;
    proxy.onRegister();
  };
  public removeProxy(proxyName: string): IProxy {
    var proxy = this.proxyMap[proxyName];
    if (proxy) {
      delete this.proxyMap[proxyName];
      proxy.onRemove();
    }
    return proxy;
  };
  public retrieveProxy(proxyName: string): IProxy {
    return this.proxyMap[proxyName] || null;
  };
  public hasProxy(proxyName: string): boolean {
    return this.proxyMap[proxyName] != null;
  };
  static SINGLETON_MSG: string = "Model singleton already constructed!";
  static instance: IModel = null;
  static getInstance(): IModel {
    if (!Model.instance) {
      Model.instance = new Model();
    }
    return Model.instance;
  };
}

export class CoreNotification
  implements INotification {
  public name: string;
  public body: any;
  public type: string;
  constructor(name: string, body?: any, type?: string) {
    if (typeof body === "undefined") { body = null; }
    if (typeof type === "undefined") { type = null; }
    this.name = null;
    this.body = null;
    this.type = null;
    this.name = name;
    this.body = body;
    this.type = type;
  };
  public getName(): string {
    return this.name;
  };
  public setBody(body: any): void {
    this.body = body;
  };
  public getBody(): any {
    return this.body;
  };
  public setType(type: string): void {
    this.type = type;
  };
  public getType(): string {
    return this.type;
  };
  public toString(): string {
    var msg = "Notification Name: " + this.getName();
    msg += "\nBody:" + ((this.getBody() == null) ? "null" : this.getBody().toString());
    msg += "\nType:" + ((this.getType() == null) ? "null" : this.getType());
    return msg;
  };
}

export class Facade
  implements IFacade {
  public model: IModel;
  public view: IView;
  public controller: IController;
  constructor() {
    this.model = null;
    this.view = null;
    this.controller = null;
    if (Facade.instance) {
      throw Error(Facade.SINGLETON_MSG);
    }
    Facade.instance = this;
    this.initializeFacade();
  };
  public initializeFacade(): void {
    this.initializeModel();
    this.initializeController();
    this.initializeView();
  };
  public initializeModel(): void {
    if (!this.model) {
      this.model = Model.getInstance();
    }
  };
  public initializeController(): void {
    if (!this.controller) {
      this.controller = Controller.getInstance();
    }
  };
  public initializeView(): void {
    if (!this.view) {
      this.view = View.getInstance();
    }
  };
  public registerCommand(notificationName: string, commandClassRef: Function): void {
    this.controller.registerCommand(notificationName, commandClassRef);
  };
  public removeCommand(notificationName: string): void {
    this.controller.removeCommand(notificationName);
  };
  public hasCommand(notificationName: string): boolean {
    return this.controller.hasCommand(notificationName);
  };
  public registerProxy(proxy: IProxy): void {
    this.model.registerProxy(proxy);
  };
  public retrieveProxy(proxyName: string): IProxy {
    return this.model.retrieveProxy(proxyName);
  };
  public removeProxy(proxyName: string): IProxy {
    var proxy;
    if (this.model) {
      proxy = this.model.removeProxy(proxyName);
    }
    return proxy;
  };
  public hasProxy(proxyName: string): boolean {
    return this.model.hasProxy(proxyName);
  };
  public registerMediator(mediator: IMediator): void {
    if (this.view) {
      this.view.registerMediator(mediator);
    }
  };
  public retrieveMediator(mediatorName: string): IMediator {
    return this.view.retrieveMediator(mediatorName);
  };
  public removeMediator(mediatorName: string): IMediator {
    var mediator;
    if (this.view) {
      mediator = this.view.removeMediator(mediatorName);
    }
    return mediator;
  };
  public hasMediator(mediatorName: string): boolean {
    return this.view.hasMediator(mediatorName);
  };
  public notifyObservers(notification: INotification): void {
    // console.log("[mvcFrame::notifyObservers this.view!=null：]"+!!this.view);
    if (this.view) {
      this.view.notifyObservers(notification);
    }
  };
  public sendNotification(name: string, body?: any, type?: string): void {
    if (typeof body === "undefined") { body = null; }
    if (typeof type === "undefined") { type = null; }
    this.notifyObservers(new CoreNotification(name, body, type));
  };
  static SINGLETON_MSG: string = "Facade singleton already constructed!";
  static instance: IFacade = null;
  static getInstance(): IFacade {
    if (!Facade.instance) {
      Facade.instance = new Facade();
    }
    return Facade.instance;
  };
}

export class Notifier
  implements INotifier {
  public facade: IFacade;
  constructor() {
    this.facade = null;
    this.facade = Facade.getInstance();
  };
  public sendNotification(name: string, body?: any, type?: string): void {
    if (typeof body === "undefined") { body = null; }
    if (typeof type === "undefined") { type = null; }
    this.facade.sendNotification(name, body, type);
  };
}

export class SimpleCommand
  extends Notifier
  implements ICommand, INotifier {
  public execute(notification: INotification): void { };
}

export class Mediator
  extends Notifier
  implements IMediator, INotifier {
  public mediatorName: string;
  public viewComponent: any;
  constructor(mediatorName?: string, viewComponent?: any) {
    super();
    if (typeof mediatorName === "undefined") { mediatorName = null; }
    if (typeof viewComponent === "undefined") { viewComponent = null; }
    // _super.call(this);
    this.mediatorName = null;
    this.viewComponent = null;
    this.mediatorName = (mediatorName != null) ? mediatorName : Mediator.NAME;
    this.viewComponent = viewComponent;
  };
  public getMediatorName(): string {
    return this.mediatorName;
  };
  public getViewComponent(): any {
    return this.viewComponent;
  };
  public setViewComponent(viewComponent: any): void {
    this.viewComponent = viewComponent;
  };
  public listNotificationInterests(): string[] {
    return new Array();
  };
  public handleNotification(notification: CoreNotification): void { };
  public onRegister(): void { };
  public onRemove(): void { };
  static NAME: string = 'Mediator';
}

export class CoreProxy
  extends Notifier
  implements IProxy, INotifier {
  public proxyName: string;
  public data: any;
  constructor(proxyName?: string, data?: any) {
    super();
    if (typeof proxyName === "undefined") { proxyName = null; }
    if (typeof data === "undefined") { data = null; }
    // _super.call(this);
    this.proxyName = null;
    this.data = null;
    this.proxyName = (proxyName != null) ? proxyName : CoreProxy.NAME;
    if (data != null) {
      this.setData(data);
    }
  };
  public getProxyName(): string {
    return this.proxyName;
  };
  public setData(data: any): void {
    this.data = data;
  };
  public getData(): any {
    return this.data;
  };
  public onRegister(): void { };
  public onRemove(): void { };
  static NAME: string = "Proxy";
}
