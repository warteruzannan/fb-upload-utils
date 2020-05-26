const admin = require("firebase-admin");
const fs = require("fs");
const axios = require("axios");

/**
 * Creates a UploadImageService
 * @param {String} bucketPath   <path_to_storage_bucket> i.g., gs://app-name.appspot.com default is '/'
 * @param {String} expiresAt    <expires_date> i.g. 01-01-2200 default 'is 01-01-2200'
 */
function createUploadImageService(bucketPath = "/", expiresAt = "01-01-2200") {
    const getAssignedUrl = async (full_path) => {
        const bucket = admin.storage().bucket(bucketPath);
        const file = bucket.file(full_path);

        const publicUrl = await file.getSignedUrl({
            action: "read",
            expires: expiresAt,
        });

        return publicUrl[0];
    };

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
                expires: expiresAt,
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

    /**
     * 1- Uploads a image to firebase storage usegin firebase admin
     * @param {String} path         <path to file> e.g, /user/uploads/profile.png
     * @param {String} file_name    <file_name> e.g. profile
     * @param {String} mimetype     <mineype> e.g. image/png
     * @returns {Promise<String>}   returns a promisse with a publicUrl that expires in
     */
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

    dowloadFile = (path) => {};

    return { uploadByPath, getAssignedUrl };
}

module.exports = { createUploadImageService };
