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

app.use(cors());
app.use(fileupload());

app.post('/', async(req, res) => {
    // get file and store it
    let igRawVideo = req.files.video;
    console.log(igRawVideo);

    const randomFileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.mp4';
    const editedFileName = `./${randomFileName}-edited.mp4`;
    //create file with fs
    // let igRawVideoLocalFile = fs.writeFileSync(randomFileName, igRawVideo.data);
    // edit file with ffmpeg
    // ffmpeg -i video.mp4 -vf "pad=w=max(ih*4/5\,iw):h=ih:x=(iw-ow)/2:y=(ih-oh/2):color=black,pad=w=iw:h=max(iw*9/16\,ih):x=(iw-ow)/2:y=(ih-oh/2):color=black" video2.mp4
    console.log('Starting to edit video');
    var command = new Promise((resolve, reject) => {
        ffmpeg('./' + randomFileName)
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
            .videoFilter("pad=w=max(ih*4/5\\,iw):h=ih:x=(iw-ow)/2:y=(ih-oh/2):color=black,pad=w=iw:h=max(iw*9/16\\,ih):x=(iw-ow)/2:y=(ih-oh/2):color=black")
            .save(editedFileName);
    });

    await command

    // create form data and post to https://file.io with axios
    let form = new FormData();
    form.append('file', fs.createReadStream(editedFileName));
    let fileIOResponse = await axios.post('https://file.io', form, {
        headers: form.getHeaders()
    });
    // return file.io url
    res.status(200).send(fileIOResponse.data.link);

    // delete local files
    fs.unlinkSync(editedFileName);
    fs.unlinkSync('./' + randomFileName);
    console.log('files deleted')
});

app.listen(process.env.PORT || 14256, () => console.log('listening on port ' + (process.env.PORT || 14256)));