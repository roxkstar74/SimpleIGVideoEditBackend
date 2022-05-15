// initiate express app
// make / endpoint that accepts file probably with fileupload api
// store file locally
// edit file ith ffmpeg/fluentffmpeg
// store file in file.io
// return file.io url

import express from 'express';
const app = express();
import fileupload from 'express-fileupload';
import fs from 'fs';
import {path} from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(path);
import axios from 'axios';
import FormData from 'form-data';
import util from 'util';
import cors from 'cors';
import got from 'got';
import dotenv from 'dotenv';
dotenv.config();

app.use(cors());
app.use(fileupload());

const fileioUpload = (formData) => {
    let tempFormData = formData;
    //@ts-ignore
    tempFormData.append('maxDownloads', '10');
    let today = new Date();
    let tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    tempFormData.append('expires', tomorrow.toISOString());
    tempFormData.append('autoDelete', 'true');
    return axios.post('https://file.io', tempFormData, {
        headers: {
            'Authorization': 'Bearer ' + process.env.FILE_IO_KEY
        }
    });
}

app.post('/', async(req, res) => {
    // get file and store it
    // let igRawVideo = req.files.video;
    // console.log(igRawVideo);

    let fileURL = req.query.fileURL;
    let fileStream = got.stream(fileURL);
    const randomFileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.mp4';

    //wait for filestream to end
    console.log('streaming')
    await new Promise((resolve, reject) => {
        let file = fs.createWriteStream('./' + randomFileName);
        fileStream.pipe(file);
        file.on('finish', () => {
            resolve();
        });
    });

    const editedFileName = `./${randomFileName}-edited.mp4`;
    //create file with fs
    // let igRawVideoLocalFile = fs.writeFileSync(randomFileName, igRawVideo.data);
    // edit file with ffmpeg
    // ffmpeg -i video.mp4 -vf "pad=w=max(ih*4/5\,iw):h=ih:x=(iw-ow)/2:y=(ih-oh/2):color=black,pad=w=iw:h=max(iw*9/16\,ih):x=(iw-ow)/2:y=(ih-oh/2):color=black" video2.mp4
    console.log('Starting to edit video');
    var command = new Promise((resolve, reject) => {
        let internalCom = ffmpeg('./' + randomFileName)
            .outputOptions('-movflags faststart')
            .on('error', function(err, stdout, stderr) {
                console.log('stdout:', stdout);
                console.log('stderr:', stderr);
                console.log('An error occurred: ' + util.inspect(err));
                reject(err);
            })
            .on('end', function(err, stdout, stderr) {
                console.log(stdout);
                console.log('Processing finished !');
                resolve('downloads/vertical.mp4');
            })
            // .videoFilter("pad=w=max(ih*4/5\\,iw):h=ih:x=(iw-ow)/2:y=(ih-oh/2):color=black,pad=w=iw:h=max(iw*9/16\\,ih):x=(iw-ow)/2:y=(ih-oh/2):color=black")
            .videoFilter('scale=1536x1920:flags=lanczos')
            .save(editedFileName);
        console.log(internalCom._getArguments());
    });

    await command

    // create form data and post to https://file.io with axios
    let form = new FormData();
    form.append('file', fs.createReadStream(editedFileName), {
        filename: 'edited.mp4'
    });
    let fileIOResponse = await fileioUpload(form);
    // return file.io url
    res.status(200).send(fileIOResponse.data.link);

    // delete local files
    fs.unlinkSync(editedFileName);
    fs.unlinkSync('./' + randomFileName);
    console.log('files deleted: ', editedFileName, randomFileName);
});

app.listen(process.env.PORT || 1919, () => console.log('listening on port ' + (process.env.PORT || 1919)));