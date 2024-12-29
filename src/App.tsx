import { Component, createRef, ReactNode } from "react";

enum ActionKind {
  Create = "Create",
  Delete = "Delete",
  Duplicate = "Duplicate",
  Translate = "Translate",
  Scale = "Scale",
  ReorderLayers = "ReorderLayers",
  Rename = "Rename",
}

enum PendingSpriteTransformationKind {
  Translate = "Translate",
  Scale = "Scale",
}

enum LayerChangeKind {
  MoveUp = "MoveUp",
  MoveDown = "MoveDown",
  MoveToTop = "MoveToTop",
  MoveToBottom = "MoveToBottom",
}

enum PasteBufferMode {
  NoOp = "NoOp",
  Width = "Width",
  Height = "Height",
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];

type Props = object;

interface State {
  readonly isProcessingFile: boolean;
  readonly imageFiles: readonly ImageFile[];
  readonly canvasWidthInput: string;
  readonly canvasHeightInput: string;
  readonly canvasScaleInput: string;
  readonly canvasBackgroundColorInput: string;
  readonly actions: readonly Action[];
  readonly redoStack: readonly Action[];
  readonly pendingTransformation: null | PendingSpriteTransformation;
  readonly isMouseOverCanvas: boolean;
  readonly pasteBuffer: PasteBuffer;
}

interface ImageFile {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly url: string;
  readonly imageElement: HTMLImageElement;
}

type Action =
  | SpriteCreation
  | SpriteDeletion
  | SpriteDuplication
  | SpriteTranslation
  | SpriteScaling
  | SpriteLayerReordering
  | SpriteRenaming;

interface SpriteCreation {
  readonly kind: ActionKind.Create;
  readonly image: ImageFile;
}

interface SpriteDeletion {
  readonly kind: ActionKind.Delete;
  readonly spriteId: number;
}

interface SpriteDuplication {
  readonly kind: ActionKind.Duplicate;
  readonly spriteId: number;
}

interface SpriteTranslation {
  readonly kind: ActionKind.Translate;
  readonly spriteId: number;
  readonly newX: number;
  readonly newY: number;
}

interface SpriteScaling {
  readonly kind: ActionKind.Scale;
  readonly spriteId: number;
  readonly newWidth: number;
}

interface SpriteLayerReordering {
  readonly kind: ActionKind.ReorderLayers;
  readonly spriteId: number;
  readonly layerChangeKind: LayerChangeKind;
}

interface SpriteRenaming {
  readonly kind: ActionKind.Rename;
  readonly spriteId: number;
  readonly idealNewName: string;
}

type PendingSpriteTransformation =
  | PendingSpriteTranslation
  | PendingSpriteScaling;

interface PendingSpriteTranslation {
  readonly kind: PendingSpriteTransformationKind.Translate;
  readonly spriteId: number;
  readonly pointerStartX: number;
  readonly pointerStartY: number;
  readonly pointerCurrentX: number;
  readonly pointerCurrentY: number;
}

interface PendingSpriteScaling {
  readonly kind: PendingSpriteTransformationKind.Scale;
  readonly spriteId: number;
  readonly pointerStartX: number;
  readonly pointerStartY: number;
  readonly pointerCurrentX: number;
  readonly pointerCurrentY: number;
}

interface Sprite {
  readonly name: string;
  readonly id: number;
  readonly image: ImageFile;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

interface SpriteExportData {
  readonly spriteName: string;
  readonly imageFileName: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface PasteBuffer {
  readonly mode: PasteBufferMode;
  readonly value: number;
}

export class App extends Component<Props, State> {
  readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  readonly fileInputRef: React.RefObject<HTMLInputElement>;
  readonly ghostCanvas: HTMLCanvasElement;
  mouseX: number;
  mouseY: number;
  isWindowDialogOpen: boolean;

  constructor(props: Props) {
    super(props);

    this.state = {
      isProcessingFile: false,
      imageFiles: [],
      canvasWidthInput: "1170",
      canvasHeightInput: "2532",
      canvasScaleInput: "0.3",
      canvasBackgroundColorInput: "transparent",
      actions: [],
      redoStack: [],
      pendingTransformation: null,
      isMouseOverCanvas: false,
      pasteBuffer: { mode: PasteBufferMode.NoOp, value: 0 },
    };

    this.canvasRef = createRef();
    this.fileInputRef = createRef();
    this.ghostCanvas = document.createElement("canvas");
    this.mouseX = 0;
    this.mouseY = 0;
    this.isWindowDialogOpen = false;

    this.bindMethods();
  }

  componentDidMount(): void {
    this.updateCanvas();
    this.addEventListeners();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).app = this;
  }

  componentWillUnmount(): void {
    this.removeEventListeners();
  }

  bindMethods(): void {
    this.onFileInputChange = this.onFileInputChange.bind(this);
    this.onCanvasWidthInputChange = this.onCanvasWidthInputChange.bind(this);
    this.onCanvasHeightInputChange = this.onCanvasHeightInputChange.bind(this);
    this.onCanvasScaleInputChange = this.onCanvasScaleInputChange.bind(this);
    this.onCanvasBackgroundColorInputChange =
      this.onCanvasBackgroundColorInputChange.bind(this);
    this.onUploadButtonClick = this.onUploadButtonClick.bind(this);
    this.onWindowKeydown = this.onWindowKeydown.bind(this);
    this.onWindowKeyup = this.onWindowKeyup.bind(this);
    this.onWindowMouseMove = this.onWindowMouseMove.bind(this);
    this.onCanvasMouseEnter = this.onCanvasMouseEnter.bind(this);
    this.onCanvasMouseLeave = this.onCanvasMouseLeave.bind(this);
    this.onDownloadSpritesDotJsonClick =
      this.onDownloadSpritesDotJsonClick.bind(this);
  }

  addEventListeners(): void {
    window.addEventListener("keydown", this.onWindowKeydown);
    window.addEventListener("keyup", this.onWindowKeyup);
    window.addEventListener("mousemove", this.onWindowMouseMove);
  }

  removeEventListeners(): void {
    window.removeEventListener("keydown", this.onWindowKeydown);
    window.removeEventListener("keyup", this.onWindowKeyup);
    window.removeEventListener("mousemove", this.onWindowMouseMove);
  }

  override setState<K extends keyof State>(
    state:
      | ((
          prevState: Readonly<State>,
          props: Readonly<Props>
        ) => Pick<State, K> | State | null)
      | (Pick<State, K> | State | null),
    callback?: () => void
  ): void;
  override setState<K extends keyof State>(
    state:
      | ((
          prevState: Readonly<State>,
          props: Readonly<Props>
        ) => Pick<State, K> | State | null)
      | (Pick<State, K> | State | null),
    callback?: () => void
  ): ReturnType<App["setState"]> {
    super.setState(state, (): void => {
      this.updateCanvas();

      if (typeof callback === "function") {
        callback();
      }
    });
  }

  render(): ReactNode {
    const {
      isProcessingFile,
      imageFiles,
      canvasWidthInput,
      canvasHeightInput,
      canvasScaleInput,
      canvasBackgroundColorInput,
    } = this.state;

    return (
      <div>
        <div className="Collage">
          <canvas
            className={
              "CollageCanvas" +
              (isCanvasBackgroundColorOpaque(canvasBackgroundColorInput)
                ? ""
                : " CheckerboardBackground")
            }
            ref={this.canvasRef}
            onMouseEnter={this.onCanvasMouseEnter}
            onMouseLeave={this.onCanvasMouseLeave}
          ></canvas>
        </div>
        <div className="Toolbar">
          <div className="ToolbarSection Toolbar__Settings">
            <h2 className="SectionLabel">Canvas size</h2>
            <label className="Toolbar__TextSetting">
              Width:{" "}
              <input
                className={
                  isNonNegativeIntegerString(canvasWidthInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasWidthInput}
                onChange={this.onCanvasWidthInputChange}
              />
            </label>
            <label className="Toolbar__TextSetting">
              Height:{" "}
              <input
                className={
                  isNonNegativeIntegerString(canvasHeightInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasHeightInput}
                onChange={this.onCanvasHeightInputChange}
              />
            </label>
          </div>
          <div className="ToolbarSection Toolbar__Settings">
            <h2>Canvas view</h2>
            <label className="Toolbar__TextSetting">
              Scale:{" "}
              <input
                className={
                  isNonNegativeRealString(canvasScaleInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasScaleInput}
                onChange={this.onCanvasScaleInputChange}
              />
            </label>
            <label className="Toolbar__TextSetting">
              Background (hex):{" "}
              <input
                className={
                  isCanvasBackgroundColorValid(canvasBackgroundColorInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasBackgroundColorInput}
                placeholder="#ffffff"
                onChange={this.onCanvasBackgroundColorInputChange}
              />
            </label>
          </div>
          <div className="ToolbarSection ImageLibrary">
            <h2 className="SectionLabel">Images</h2>
            <ul className="ImageLibrary__ImageList">
              {imageFiles.map((imageFile, index) => (
                <li
                  key={String(index) + ":" + imageFile.name}
                  className="ImageLibrary__ImageListItem"
                >
                  <button
                    onClick={() => {
                      this.createSpriteFromImage(imageFile);
                    }}
                  >
                    Add
                  </button>{" "}
                  {imageFile.name}
                </li>
              ))}
            </ul>
            <div className="Toolbar__Upload">
              <input
                className="HiddenWithNegativeZIndex"
                type="file"
                accept={[".zip"].concat(IMAGE_EXTENSIONS).join(",")}
                multiple
                onChange={this.onFileInputChange}
                ref={this.fileInputRef}
              />

              {isProcessingFile ? (
                <p>Processing file...</p>
              ) : (
                <button onClick={this.onUploadButtonClick}>Upload new</button>
              )}
            </div>
          </div>
          <div className="ToolbarSection ImageLibrary">
            <h2 className="SectionLabel">Export</h2>
            <button onClick={this.onDownloadSpritesDotJsonClick}>
              Download sprites.json
            </button>
          </div>
        </div>
      </div>
    );
  }

  updateCanvas(): void {
    const canvas = this.canvasRef.current;

    if (canvas === null) {
      return;
    }

    updateCanvasSize(canvas, this.state);
    updateCanvasBackgroundColor(canvas, this.state);
    paintCanvas(canvas, this.state);
  }

  onFileInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;

    if (files === null) {
      return;
    }

    this.setState(
      {
        isProcessingFile: true,
      },
      () => {
        void Promise.all(
          Array.from(files).map((file) => {
            if (!isImageFileName(file.name)) {
              const errorMessage = "Invalid file type. File name: " + file.name;
              window.alert(errorMessage);
              throw new Error(errorMessage);
            }

            return file
              .arrayBuffer()
              .then((buffer) =>
                loadImageFileFromArrayBuffer(buffer, file.name)
              );
          })
        ).then((newImageFiles) => {
          this.setState((prevState) => {
            const combinedImageFiles = prevState.imageFiles
              .concat(newImageFiles)
              .sort((a, b) => compareStrings(a.name, b.name));
            return {
              isProcessingFile: false,
              imageFiles: combinedImageFiles,
            };
          });
        });
      }
    );
  }

  onCanvasWidthInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasWidthInput: event.target.value,
    });
  }

  onCanvasHeightInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasHeightInput: event.target.value,
    });
  }

  onCanvasScaleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasScaleInput: event.target.value,
    });
  }

  onCanvasBackgroundColorInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    this.setState({
      canvasBackgroundColorInput: event.target.value,
    });
  }

  onUploadButtonClick(): void {
    const fileInput = this.fileInputRef.current;

    if (fileInput === null) {
      return;
    }

    fileInput.click();
  }

  createSpriteFromImage(image: ImageFile): void {
    this.setState((prevState) => {
      return {
        actions: prevState.actions.concat({
          kind: ActionKind.Create,
          image,
        }),
        redoStack: [],
      };
    });
  }

  onWindowKeydown(event: KeyboardEvent): void {
    if (this.isWindowDialogOpen) {
      return;
    }

    const { key } = event;

    if (
      key.toLowerCase() === "escape" &&
      this.state.pendingTransformation !== null
    ) {
      this.setState({
        pendingTransformation: null,
      });
    }

    const canvas = this.canvasRef.current;

    if (
      !this.state.isMouseOverCanvas ||
      this.state.pendingTransformation !== null ||
      canvas === null
    ) {
      return;
    }

    const pointerCoords = this.getPointerCoords();

    if (pointerCoords === null) {
      return;
    }

    const [pointerX, pointerY] = pointerCoords;

    const { canvasWidthInput, canvasHeightInput } = this.state;

    const canvasWidth = isNonNegativeIntegerString(canvasWidthInput)
      ? Number.parseInt(canvasWidthInput)
      : 0;

    const canvasHeight = isNonNegativeIntegerString(canvasHeightInput)
      ? Number.parseInt(canvasHeightInput)
      : 0;

    if (
      pointerX < 0 ||
      pointerX > canvasWidth ||
      pointerY < 0 ||
      pointerY > canvasHeight
    ) {
      return;
    }

    const selectedSprite = getSelectedSprite(
      pointerX,
      pointerY,
      this.state,
      this.ghostCanvas
    );

    if (selectedSprite === null) {
      return;
    }

    if (key === "t") {
      this.setState({
        pendingTransformation: {
          kind: PendingSpriteTransformationKind.Translate,
          spriteId: selectedSprite.id,
          pointerStartX: pointerX,
          pointerStartY: pointerY,
          pointerCurrentX: pointerX,
          pointerCurrentY: pointerY,
        },
      });
      return;
    }

    if (key === "s") {
      this.setState({
        pendingTransformation: {
          kind: PendingSpriteTransformationKind.Scale,
          spriteId: selectedSprite.id,
          pointerStartX: pointerX,
          pointerStartY: pointerY,
          pointerCurrentX: pointerX,
          pointerCurrentY: pointerY,
        },
      });
      return;
    }
  }

  getPointerCoords(): null | readonly [number, number] {
    const canvas = this.canvasRef.current;

    if (canvas === null) {
      return null;
    }

    const { canvasWidthInput, canvasHeightInput, canvasScaleInput } =
      this.state;

    const canvasWidth = isNonNegativeIntegerString(canvasWidthInput)
      ? Number.parseInt(canvasWidthInput)
      : 0;

    const canvasHeight = isNonNegativeIntegerString(canvasHeightInput)
      ? Number.parseInt(canvasHeightInput)
      : 0;

    if (canvasWidth === 0 || canvasHeight === 0) {
      return null;
    }

    const canvasScale = isNonNegativeRealString(canvasScaleInput)
      ? Number.parseFloat(canvasScaleInput)
      : 1;

    const { mouseX, mouseY } = this;
    const rect = canvas.getBoundingClientRect();
    const pointerX = (mouseX - rect.left) / canvasScale;
    const pointerY = (mouseY - rect.top) / canvasScale;

    return [pointerX, pointerY];
  }

  onWindowKeyup(event: KeyboardEvent): void {
    if (this.isWindowDialogOpen) {
      return;
    }

    const { key } = event;

    const { pendingTransformation, actions, redoStack } = this.state;

    if (
      (key.toLowerCase() === "t" &&
        pendingTransformation !== null &&
        pendingTransformation.kind ===
          PendingSpriteTransformationKind.Translate) ||
      (key.toLowerCase() === "s" &&
        pendingTransformation !== null &&
        pendingTransformation.kind === PendingSpriteTransformationKind.Scale)
    ) {
      this.setState((prevState) => {
        const sprites = getSprites({
          ...prevState,
          pendingTransformation: null,
        });
        return {
          ...prevState,
          actions: prevState.actions.concat([
            finalizePendingSpriteTransformation(pendingTransformation, sprites),
          ]),
          redoStack: [],
          pendingTransformation: null,
        };
      });
      return;
    }

    if (
      key.toLowerCase() === "z" &&
      actions.length > 0 &&
      pendingTransformation === null
    ) {
      this.setState((prevState) => {
        const meaningfulPrevStateActions = getMeaningfulActions(
          prevState.actions
        );
        return {
          ...prevState,
          actions: meaningfulPrevStateActions.slice(0, -1),
          redoStack: prevState.redoStack.concat(
            meaningfulPrevStateActions.slice(-1)
          ),
        };
      });
      return;
    }

    if (
      key.toLowerCase() === "y" &&
      redoStack.length > 0 &&
      pendingTransformation === null
    ) {
      this.setState((prevState) => {
        return {
          ...prevState,
          actions: prevState.actions.concat(prevState.redoStack.slice(-1)),
          redoStack: prevState.redoStack.slice(0, -1),
        };
      });
      return;
    }

    const pointerCoords = this.getPointerCoords();

    if (pointerCoords === null) {
      return;
    }

    const [pointerX, pointerY] = pointerCoords;

    const selectedSprite = getSelectedSprite(
      pointerX,
      pointerY,
      this.state,
      this.ghostCanvas
    );

    if (selectedSprite === null) {
      return;
    }

    if (key.toLowerCase() === "x" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.Delete,
            spriteId: selectedSprite.id,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "d" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.Duplicate,
            spriteId: selectedSprite.id,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "w" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        pasteBuffer: {
          mode: PasteBufferMode.Width,
          value: selectedSprite.width,
        },
      }));
      return;
    }

    if (key.toLowerCase() === "h" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        pasteBuffer: {
          mode: PasteBufferMode.Height,
          value:
            (selectedSprite.width * selectedSprite.image.height) /
            selectedSprite.image.width,
        },
      }));
      return;
    }

    if (key.toLowerCase() === "v" && pendingTransformation === null) {
      this.applyPasteBuffer(selectedSprite);
      return;
    }

    if (key.toLowerCase() === "u" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.ReorderLayers,
            spriteId: selectedSprite.id,
            layerChangeKind: LayerChangeKind.MoveUp,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "i" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.ReorderLayers,
            spriteId: selectedSprite.id,
            layerChangeKind: LayerChangeKind.MoveToTop,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "j" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.ReorderLayers,
            spriteId: selectedSprite.id,
            layerChangeKind: LayerChangeKind.MoveDown,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "k" && pendingTransformation === null) {
      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.ReorderLayers,
            spriteId: selectedSprite.id,
            layerChangeKind: LayerChangeKind.MoveToBottom,
          },
        ]),
        redoStack: [],
      }));
      return;
    }

    if (key.toLowerCase() === "n" && pendingTransformation === null) {
      const newName = this.prompt(
        `Enter new sprite name for ${selectedSprite.name}: `
      );

      if (newName === null || /^\s*$/.test(newName)) {
        return;
      }

      this.setState((prevState) => ({
        ...prevState,
        actions: prevState.actions.concat([
          {
            kind: ActionKind.Rename,
            spriteId: selectedSprite.id,
            idealNewName: newName,
          },
        ]),
        redoStack: [],
      }));
      return;
    }
  }

  applyPasteBuffer(target: Sprite): void {
    const { pasteBuffer } = this.state;

    switch (pasteBuffer.mode) {
      case PasteBufferMode.NoOp:
        break;

      case PasteBufferMode.Width:
        this.applyWidthPaste(target, pasteBuffer.value);
        break;

      case PasteBufferMode.Height:
        this.applyHeightPaste(target, pasteBuffer.value);
        break;

      default:
        typecheckedAssertNever(pasteBuffer.mode);
    }
  }

  applyWidthPaste(target: Sprite, width: number): void {
    this.setState((prevState) => ({
      ...prevState,
      actions: prevState.actions.concat([
        {
          kind: ActionKind.Scale,
          spriteId: target.id,
          newWidth: width,
        },
      ]),
      redoStack: [],
    }));
  }

  applyHeightPaste(target: Sprite, height: number): void {
    const newWidth = (height * target.image.width) / target.image.height;
    this.setState((prevState) => ({
      ...prevState,
      actions: prevState.actions.concat([
        {
          kind: ActionKind.Scale,
          spriteId: target.id,
          newWidth,
        },
      ]),
      redoStack: [],
    }));
  }

  onWindowMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    const pointerCoords = this.getPointerCoords();

    if (pointerCoords === null) {
      return;
    }

    const [pointerX, pointerY] = pointerCoords;

    this.setState((prevState) => {
      const { pendingTransformation } = prevState;
      return {
        ...prevState,
        pendingTransformation:
          pendingTransformation === null
            ? null
            : {
                ...pendingTransformation,
                pointerCurrentX: pointerX,
                pointerCurrentY: pointerY,
              },
      };
    });
  }

  onCanvasMouseEnter(): void {
    this.setState({
      isMouseOverCanvas: true,
    });
  }

  onCanvasMouseLeave(): void {
    this.setState({
      isMouseOverCanvas: false,
    });
  }

  onDownloadSpritesDotJsonClick(): void {
    const sprites = getSprites(this.state);
    const spritesJson = serializeSpritesAsJsonString(sprites);
    downloadJsonString(spritesJson, "sprites.json");
  }

  alert(message: string): void {
    this.isWindowDialogOpen = true;
    window.alert(message);
    this.isWindowDialogOpen = false;
  }

  prompt(message: string): null | string {
    this.isWindowDialogOpen = true;
    const out = window.prompt(message);
    this.isWindowDialogOpen = false;
    return out;
  }
}

function isImageFileName(name: string): boolean {
  const lowerCaseName = name.toLowerCase();

  if (
    lowerCaseName === "" ||
    lowerCaseName.split(/\/|\\/).slice(-1)[0].startsWith(".")
  ) {
    return false;
  }

  return IMAGE_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension)
  );
}

function loadImageFileFromArrayBuffer(
  buffer: ArrayBuffer,
  imageName: string
): Promise<ImageFile> {
  const dotlessExtension = getDotlessExtension(imageName);
  if (!isImageFileName("test." + dotlessExtension)) {
    throw new Error("Invalid image file type. Name: " + imageName);
  }

  const blob = new Blob([buffer], {
    type: "image/" + dotlessExtension.toLowerCase(),
  });
  const url = URL.createObjectURL(blob);

  const imageElement = new Image();

  const out = new Promise<ImageFile>((resolve, reject) => {
    imageElement.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      const context = canvas.getContext("2d")!;
      context.drawImage(imageElement, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      resolve({
        name: imageName,
        width: canvas.width,
        height: canvas.height,
        data: imageData.data,
        url,
        imageElement,
      });
    });

    imageElement.addEventListener("error", reject);
  });

  imageElement.src = url;

  return out;
}

function getDotlessExtension(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

function isNonNegativeIntegerString(value: string): boolean {
  return /^\d+$/.test(value);
}

function isNonNegativeRealString(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value);
}

function isCanvasBackgroundColorValid(value: string): boolean {
  return /^(?:(?:transparent)|(?:\s*)|(?:#?[a-f\d]{6}))$/.test(
    value.toLowerCase()
  );
}

function isCanvasBackgroundColorOpaque(value: string): boolean {
  return /^#?[a-f\d]{6}$/.test(value.toLowerCase());
}

function getUnusedId(sprites: readonly Sprite[]): number {
  if (sprites.length === 0) {
    return 0;
  }

  return 1 + Math.max(...sprites.map((sprite) => sprite.id));
}

function getUnusedSpriteName(
  idealName: string,
  sprites: readonly Sprite[]
): string {
  const existingNames = new Set(sprites.map((sprite) => sprite.name));

  if (!existingNames.has(idealName)) {
    return idealName;
  }

  let counter = 1;
  let candidate = idealName + " (" + String(counter) + ")";

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (!existingNames.has(candidate)) {
      return candidate;
    }

    ++counter;
    candidate = idealName + " (" + String(counter) + ")";
  }
}

function updateCanvasSize(canvas: HTMLCanvasElement, state: State): void {
  const { canvasWidthInput, canvasHeightInput, canvasScaleInput } = state;

  const unscaledCanvasWidth = isNonNegativeIntegerString(canvasWidthInput)
    ? Number.parseInt(canvasWidthInput)
    : 0;

  const unscaledCanvasHeight = isNonNegativeIntegerString(canvasHeightInput)
    ? Number.parseInt(canvasHeightInput)
    : 0;

  const { devicePixelRatio } = window;

  canvas.width = unscaledCanvasWidth * devicePixelRatio;
  canvas.height = unscaledCanvasHeight * devicePixelRatio;

  const scale = isNonNegativeRealString(canvasScaleInput)
    ? Number.parseFloat(canvasScaleInput)
    : 1;

  canvas.style.width = String(unscaledCanvasWidth * scale) + "px";
  canvas.style.height = String(unscaledCanvasHeight * scale) + "px";
}

function updateCanvasBackgroundColor(
  canvas: HTMLCanvasElement,
  state: State
): void {
  const { canvasBackgroundColorInput } = state;

  if (isCanvasBackgroundColorOpaque(canvasBackgroundColorInput)) {
    const hexColor = canvasBackgroundColorInput.startsWith("#")
      ? canvasBackgroundColorInput
      : "#" + canvasBackgroundColorInput;
    canvas.style.backgroundColor = hexColor;
  } else {
    canvas.style.removeProperty("background-color");
  }
}

function paintCanvas(canvas: HTMLCanvasElement, state: State): void {
  const sprites = getSprites(state);

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Failed to get 2D context from canvas");
  }

  const { devicePixelRatio } = window;

  context.resetTransform();
  context.scale(devicePixelRatio, devicePixelRatio);

  for (const sprite of sprites) {
    context.drawImage(
      sprite.image.imageElement,
      sprite.x,
      sprite.y,
      sprite.width,
      (sprite.width * sprite.image.height) / sprite.image.width
    );
  }
}

function getSprites(state: State): readonly Sprite[] {
  const { actions, pendingTransformation } = state;

  let sprites: readonly Sprite[] = [];

  for (const action of actions) {
    sprites = applyAction(action, sprites);
  }

  if (pendingTransformation !== null) {
    sprites = applyPendingTransformation(pendingTransformation, sprites);
  }

  return sprites;
}

function applyAction(
  action: Action,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  switch (action.kind) {
    case ActionKind.Create:
      return applySpriteCreation(action, sprites);
    case ActionKind.Delete:
      return applySpriteDeletion(action, sprites);
    case ActionKind.Duplicate:
      return applySpriteDuplication(action, sprites);
    case ActionKind.Translate:
      return applySpriteTranslation(action, sprites);
    case ActionKind.Scale:
      return applySpriteScaling(action, sprites);
    case ActionKind.ReorderLayers:
      return applySpriteLayerReordering(action, sprites);
    case ActionKind.Rename:
      return applySpriteRenaming(action, sprites);
  }
}

function applySpriteCreation(
  action: SpriteCreation,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  const idealName = isImageFileName(action.image.name)
    ? action.image.name.replace(/\.[^.]*$/, "")
    : action.image.name;
  return sprites.concat({
    name: getUnusedSpriteName(idealName, sprites),
    id: getUnusedId(sprites),
    image: action.image,
    x: 0,
    y: 0,
    width: action.image.width,
  });
}

function applySpriteDeletion(
  action: SpriteDeletion,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  return sprites.filter((sprite) => sprite.id !== action.spriteId);
}

function applySpriteDuplication(
  action: SpriteDuplication,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  const original = sprites.find((s) => s.id === action.spriteId);

  if (original === undefined) {
    return sprites;
  }

  const duplicate: Sprite = {
    name: getUnusedSpriteName(original.name, sprites),
    id: getUnusedId(sprites),
    image: original.image,
    x: original.x,
    y: original.y,
    width: original.width,
  };

  return sprites.concat([duplicate]);
}

function applySpriteTranslation(
  action: SpriteTranslation,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  return sprites.map((sprite) =>
    sprite.id === action.spriteId
      ? {
          ...sprite,
          x: action.newX,
          y: action.newY,
        }
      : sprite
  );
}

function applySpriteScaling(
  action: SpriteScaling,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  return sprites.map((sprite) => {
    if (sprite.id !== action.spriteId) {
      return sprite;
    }

    const { newWidth } = action;

    const oldWidth = sprite.width;

    const newHeight =
      (action.newWidth * sprite.image.height) / sprite.image.width;

    const oldHeight = (sprite.width * sprite.image.height) / sprite.image.width;

    return {
      ...sprite,
      x: sprite.x - (newWidth - oldWidth) / 2,
      y: sprite.y - (newHeight - oldHeight) / 2,
      width: action.newWidth,
    };
  });
}

function applySpriteLayerReordering(
  action: SpriteLayerReordering,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  const spriteIndex = sprites.findIndex((s) => s.id === action.spriteId);

  if (spriteIndex === -1) {
    return sprites;
  }

  const sprite = sprites[spriteIndex];

  switch (action.layerChangeKind) {
    case LayerChangeKind.MoveUp:
      if (spriteIndex === sprites.length - 1) {
        return sprites;
      }

      return sprites
        .slice(0, spriteIndex)
        .concat([sprites[spriteIndex + 1], sprite])
        .concat(sprites.slice(spriteIndex + 2));

    case LayerChangeKind.MoveDown:
      if (spriteIndex === 0) {
        return sprites;
      }

      return sprites
        .slice(0, spriteIndex - 1)
        .concat([sprite, sprites[spriteIndex - 1]])
        .concat(sprites.slice(spriteIndex + 1));

    case LayerChangeKind.MoveToTop:
      return sprites
        .slice(0, spriteIndex)
        .concat(sprites.slice(spriteIndex + 1))
        .concat([sprite]);

    case LayerChangeKind.MoveToBottom:
      return [sprite]
        .concat(sprites.slice(0, spriteIndex))
        .concat(sprites.slice(spriteIndex + 1));
  }
}

function applySpriteRenaming(
  action: SpriteRenaming,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  const newName = getUnusedSpriteName(action.idealNewName, sprites);
  return sprites.map((sprite) =>
    sprite.id === action.spriteId ? { ...sprite, name: newName } : sprite
  );
}

function applyPendingTransformation(
  transformation: PendingSpriteTransformation,
  sprites: readonly Sprite[]
): readonly Sprite[] {
  const action = finalizePendingSpriteTransformation(transformation, sprites);
  return applyAction(action, sprites);
}

function getSelectedSprite(
  pointerX: number,
  pointerY: number,
  state: State,
  ghostCanvas: HTMLCanvasElement
): null | Sprite {
  const context = ghostCanvas.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new Error("Failed to get 2D context from ghost canvas");
  }

  const { canvasWidthInput, canvasHeightInput } = state;

  const canvasWidth = isNonNegativeIntegerString(canvasWidthInput)
    ? Number.parseInt(canvasWidthInput)
    : 0;

  const canvasHeight = isNonNegativeIntegerString(canvasHeightInput)
    ? Number.parseInt(canvasHeightInput)
    : 0;

  if (canvasWidth === 0 || canvasHeight === 0) {
    return null;
  }

  ghostCanvas.width = canvasWidth;
  ghostCanvas.height = canvasHeight;

  context.reset();
  context.clearRect(0, 0, canvasWidth, canvasHeight);

  const sprites = getSprites(state);
  for (let i = sprites.length - 1; i >= 0; i--) {
    const sprite = sprites[i];
    context.drawImage(
      sprite.image.imageElement,
      sprite.x,
      sprite.y,
      sprite.width,
      (sprite.width * sprite.image.height) / sprite.image.width
    );

    const imageData = context.getImageData(pointerX, pointerY, 1, 1);
    if (imageData.data[3] > 0) {
      return sprite;
    }
  }

  return null;
}

function finalizePendingSpriteTransformation(
  transformation: PendingSpriteTransformation,
  sprites: readonly Sprite[]
): Action {
  switch (transformation.kind) {
    case PendingSpriteTransformationKind.Translate:
      return finalizePendingSpriteTranslation(transformation, sprites);
    case PendingSpriteTransformationKind.Scale:
      return finalizePendingSpriteScaling(transformation, sprites);
  }
}

function finalizePendingSpriteTranslation(
  transformation: PendingSpriteTranslation,
  sprites: readonly Sprite[]
): Action {
  const oldSprite = sprites.find((s) => s.id === transformation.spriteId);
  const oldX = oldSprite === undefined ? 0 : oldSprite.x;
  const oldY = oldSprite === undefined ? 0 : oldSprite.y;

  return {
    kind: ActionKind.Translate,
    spriteId: transformation.spriteId,
    newX: oldX + transformation.pointerCurrentX - transformation.pointerStartX,
    newY: oldY + transformation.pointerCurrentY - transformation.pointerStartY,
  };
}

function finalizePendingSpriteScaling(
  transformation: PendingSpriteScaling,
  sprites: readonly Sprite[]
): Action {
  const oldSprite = sprites.find((s) => s.id === transformation.spriteId);
  const oldX = oldSprite === undefined ? 0 : oldSprite.x;
  const oldY = oldSprite === undefined ? 0 : oldSprite.y;
  const oldWidth = oldSprite === undefined ? 0 : oldSprite.width;
  const oldImageWidth = oldSprite === undefined ? 0 : oldSprite.image.width;
  const oldImageHeight = oldSprite === undefined ? 0 : oldSprite.image.height;

  const centerX = oldX + oldWidth / 2;
  const centerY = oldY + (oldWidth * oldImageHeight) / oldImageWidth / 2;
  const startPointerDistance = Math.hypot(
    transformation.pointerStartX - centerX,
    transformation.pointerStartY - centerY
  );
  const currentPointerDistance = Math.hypot(
    transformation.pointerCurrentX - centerX,
    transformation.pointerCurrentY - centerY
  );

  return {
    kind: ActionKind.Scale,
    spriteId: transformation.spriteId,
    newWidth: (oldWidth * currentPointerDistance) / startPointerDistance,
  };
}

function serializeSpritesAsJsonString(sprites: readonly Sprite[]): string {
  const out: SpriteExportData[] = sprites.map((sprite) => ({
    spriteName: sprite.name,
    imageFileName: sprite.image.name,
    x: sprite.x,
    y: sprite.y,
    width: sprite.width,
    height: (sprite.width * sprite.image.height) / sprite.image.width,
  }));

  return JSON.stringify(out, null, 2);
}

function downloadJsonString(jsonString: string, fileName: string): void {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
}

function typecheckedAssertNever(impossible: never): never {
  return impossible;
}

/**
 * Returns the original array except with all the no-op (idempotent) actions removed.
 */
function getMeaningfulActions(actions: readonly Action[]): readonly Action[] {
  let sprites: readonly Sprite[] = [];
  const out: Action[] = [];

  for (const action of actions) {
    const newSprites = applyAction(action, sprites);

    if (!areSpriteArraysEqual(sprites, newSprites)) {
      out.push(action);
      sprites = newSprites;
    }
  }

  return out;
}

function areSpriteArraysEqual(
  a: readonly Sprite[],
  b: readonly Sprite[]
): boolean {
  return (
    a.length === b.length && a.every((aItem, i) => areSpritesEqual(aItem, b[i]))
  );
}

function areSpritesEqual(a: Sprite, b: Sprite): boolean {
  return (
    a.name === b.name &&
    a.id === b.id &&
    a.image === b.image &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width
  );
}
