export const getFileName = (url) => {
  if (!url) return "";
  const withoutParams = url.split("?")[0];
  let fileName = withoutParams.split("---").pop();
  fileName = decodeURIComponent(fileName);
  fileName = fileName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.]/g, '');
  return fileName;
};


  export const getFileNamev2 = (url) => {
    if (!url) return "";
    const withoutParams = url.split("?")[0];
    let name = withoutParams.split("---").pop();
    return decodeURIComponent(name);
  };
