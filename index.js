const admin = require("firebase-admin");
const fs = require("fs");

function createUploadImageService(bucketPath = "/") {
    const __uploadByPath = (path, file_name, metadata, cb) => {
        const bucket = admin.storage().bucket(bucketPath);
        const file = bucket.file(file_name);

        const readStream = fs.createReadStream(path);

        const writeStream = file.createWriteStream({ metadata });

        writeStream.on("error", function (err) {
            cb(err, null);
        });

        writeStream.on("finish", function () {
            file.getSignedUrl({
                action: "read",
                expires: "03-09-2491",
            })
                .then((publicUrl) => {
                    cb(null, publicUrl[0]);
                })
                .catch((err) => {
                    cb(err, null);
                });
        });

        readStream.pipe(writeStream);
    };

    const uploadByFile = ({ path, file_name, mimetype }) => {
        return uploadByPath(path, file_name, mimetype);
    };

    const uploadByPath = (path, file_name, mimetype) => {
        let metadata = { contentType: "image/jpeg" };

        if (mimetype !== undefined) {
            const [_, extension] = mimetype.split("/");
            metadata = { contentType: mimetype };
            file_name = `${file_name}.${extension}`;
        }

        return new Promise((resolve, reject) => {
            __uploadByPath(path, file_name, metadata, (err, url) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(url);
                }
            });
        });
    };

    return { uploadByPath, uploadByFile };
}

module.exports = { createUploadImageService };
