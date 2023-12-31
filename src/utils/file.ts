export function loadFile(formatToFilter: string): Promise<File> {
  return new Promise(resolve => {
    const fileInput = document.createElement('input');
    fileInput.style.display = 'none';
    fileInput.type = 'file';
    fileInput.accept = formatToFilter || '.json';
    // @ts-expect-error
    fileInput.acceptCharset = 'utf8';

    document.body.appendChild(fileInput);

    function changeHandler() {
      if (fileInput.files && fileInput.files.length > 0) {
        fileInput.removeEventListener('change', changeHandler);
        setTimeout(() => fileInput.remove(), 500);
        resolve(fileInput.files[0]);
      }
    }

    fileInput.addEventListener('change', changeHandler);
    fileInput.click();
  });
}

export function readFileText(file: File, encoding = 'UTF-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const fReader = new FileReader();
    fReader.onerror = err => reject(err);
    fReader.onloadend = event => {
      const result = event.target!.result as string;
      resolve(result || '');
    };
    fReader.readAsText(file, encoding);
  });
}
