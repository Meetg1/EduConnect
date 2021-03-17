const { google } = require("googleapis");
const credentials = require("./credentials.json");
const fs = require("fs");

const scopes = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.JWT(
 credentials.client_email,
 null,
 credentials.private_key,
scopes
);
const drive = google.drive({
 version: "v3",
  auth,
});

//  drive.files.list({}, (err, res) => {
//   if (err) throw err;
//   const files = res.data.files;
// if (files.length) {
//     files.map((file) => {
// console.log(file);
// });
//   } else {
//      console.log("No files found");
//    }
// });

//  (async function () {
//   let res = await drive.files.list({
// pageSize: 5,
//      fields: "*",
// orderBy: "createdTime desc",
//    });
//   console.log(res.data);
// })();

//================uploading file to a folder

const uploadToDrive = async (fileName, mime_type) => {
    const folderId = "1N37Rit2LM4EMnQePbFmqDc5cM3QevM_R";
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: mime_type,
    body: fs.createReadStream(`./uploads/${fileName}`),
  };

  try {
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });
    return uploadedFile;
  } catch (error) {
    return error;
  }
};

const picToDrive = async (picName, mime_type) => {
  const folderId = "1J2lVVPUgNXGi2CXXb1V53aHY_ucKpvgZ";
  const fileMetadata = {
    name: picName,
    parents: [folderId],
  };
  const media = {
    mimeType: mime_type,
    body: fs.createReadStream(`./uploads/${picName}`),
  };

  try {
    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });
    return uploadedFile;
  } catch (error) {
    return error;
  }
};

module.exports.uploadToDrive = uploadToDrive;
module.exports.picToDrive = picToDrive;
