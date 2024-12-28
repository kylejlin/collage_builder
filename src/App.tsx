import { Component, ReactNode } from "react";
import JSZip from "jszip";

type Props = object;

interface State {
  readonly isProcessingFile: boolean;
  readonly uploadedFileName: string;
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
      uploadedFileName: "",
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

    if (files === null || files.length === 0) {
      return;
    }

    const file = files[0];

    if (isZipFileName(file.name)) {
      this.setState(
        {
          isProcessingFile: true,
        },
        () => {
          this.onZipFileUpload(file);
        }
      );
      return;
    }

    if (isImageFileName(file.name)) {
      this.setState(
        {
          isProcessingFile: true,
        },
        () => {
          this.onImageFileUpload(file);
        }
      );
      return;
    }

    window.alert("Invalid file type.");
  }

  onZipFileUpload(file: File): void {
    void JSZip.loadAsync(file)
      .then(getImageEntries)
      .then((imageEntries) =>
        Promise.all(imageEntries.map(loadImageFileFromZipEntry))
      )
      .then((unsortedImageFiles) => {
        const imageFiles = unsortedImageFiles.sort((a, b) =>
          compareStrings(a.name, b.name)
        );
        this.setState({
          isProcessingFile: false,
          uploadedFileName: file.name,
          imageFiles,
        });
      });
  }

  onImageFileUpload(file: File): void {
    void file
      .arrayBuffer()
      .then((buffer) => loadImageFileFromArrayBuffer(buffer, file.name))
      .then((imageFile) => {
        this.setState({
          isProcessingFile: false,
          uploadedFileName: file.name,
          imageFiles: [imageFile],
        });
      });
  }
}

function isZipFileName(name: string): boolean {
  const lowerCaseName = name.toLowerCase();

  if (
    lowerCaseName === "" ||
    lowerCaseName.split(/\/|\\/).slice(-1)[0].startsWith(".")
  ) {
    return false;
  }

  return lowerCaseName.endsWith(".zip");
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

function getImageEntries(zip: JSZip): readonly JSZip.JSZipObject[] {
  const out: JSZip.JSZipObject[] = [];

  zip.forEach((_, zipEntry) => {
    if (zipEntry.dir) {
      return;
    }

    if (!isImageFileName(zipEntry.name)) {
      return;
    }

    out.push(zipEntry);
  });

  return out.slice();
}

function loadImageFileFromZipEntry(
  zipEntry: JSZip.JSZipObject
): Promise<ImageFile> {
  return zipEntry
    .async("arraybuffer")
    .then((buffer) => loadImageFileFromArrayBuffer(buffer, zipEntry.name));
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
