import { Component, ReactNode } from "react";

type Props = object;

interface State {
  readonly isProcessingFile: boolean;
  readonly imageFiles: readonly ImageFile[];
  readonly sprites: readonly Sprite[];
}

interface ImageFile {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly url: string;
}

interface Sprite {
  readonly name: string;
  readonly image: ImageFile;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];

export class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isProcessingFile: false,
      imageFiles: [],
      sprites: [],
    };

    this.bindMethods();
  }

  bindMethods(): void {
    this.onFileInputChange = this.onFileInputChange.bind(this);
  }

  render(): ReactNode {
    const { isProcessingFile, imageFiles: originalImageFiles } = this.state;

    return (
      <div>
        <div className="Collage">
          <canvas className="CollageCanvas"></canvas>
        </div>
        <div className="Toolbar">
          <div className="Toolbar__Upload">
            {isProcessingFile ? (
              <p>Processing file...</p>
            ) : originalImageFiles.length === 0 ? (
              <>
                <input
                  type="file"
                  accept={[".zip"].concat(IMAGE_EXTENSIONS).join(",")}
                  onChange={this.onFileInputChange}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
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

  const image = new Image();

  const out = new Promise<ImageFile>((resolve, reject) => {
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob === null) {
          const error = new Error("Failed to create blob for " + imageName);
          reject(error);
          throw error;
        }

        const url = URL.createObjectURL(blob);

        resolve({
          name: imageName,
          width: canvas.width,
          height: canvas.height,
          data: imageData.data,
          url,
        });
      });
    });

    image.addEventListener("error", reject);
  });

  image.src = url;

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
