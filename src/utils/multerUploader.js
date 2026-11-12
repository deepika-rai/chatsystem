import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

const uploadimage = async (file_source, file_type, file_name, full_file_name, req, res, next) => {
  try {
    // --- Basic input logging for debugging ---
    console.log('uploadimage: file_name', file_name, 'full_file_name', full_file_name);
    console.log('REFERLOAN_STORAGE_ID present?', process.env.REFERLOAN_STORAGE_ID);
    console.log('REFERLOAN_STORAGE_KEY present?', process.env.REFERLOAN_STORAGE_KEY);

    // Normalize source -> Buffer
    let fileBuffer;
    if (Buffer.isBuffer(file_source)) {
      fileBuffer = file_source;
    } else if (typeof file_source === 'string') {
      // handle data:...;base64, or raw base64
      const dataUrlMatch = file_source.match(/^data:(.+);base64,(.+)$/);
      fileBuffer = Buffer.from(dataUrlMatch ? dataUrlMatch[2] : file_source, 'base64');
    } else {
      throw new Error('Unsupported file_source type. Expect Buffer or base64 string.');
    }

    const form = new FormData();
    form.append('name', path.basename(file_name || full_file_name));
    form.append('extension', file_type || path.extname(file_name || full_file_name).replace('.', ''));
    form.append('parentId', process.env.REFERLOAN_STORAGE_ID);
    form.append('file', fileBuffer, {
      filename: path.basename(file_name || full_file_name),
      contentType: file_type
    });

    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${process.env.REFERLOAN_STORAGE_KEY}`,
    };

    // compute content-length (some servers require it)
    const contentLength = await new Promise((resolve, reject) => {
      form.getLength((err, length) => err ? reject(err) : resolve(length));
    });
    headers['Content-Length'] = contentLength;

    // --- Upload ---
    const uploadResp = await axios.post('https://storage.referloan.in/api/upload', form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    console.log('uploadResp status:', uploadResp.status);
    if (!uploadResp?.data?.data?.id) {
      console.error('upload response missing id:', uploadResp.data);
      throw new Error('upload response missing id');
    }

    const uploadId = uploadResp.data.data.id;
    console.log('Uploaded file id:', uploadId);

    // --- Share ---
    const shareResp = await axios.post('https://storage.referloan.in/api/share', {
      id: uploadId,
      isPassword: false,
      type: 'file'
    }, {
      headers: { Authorization: `Bearer ${process.env.REFERLOAN_STORAGE_KEY}` }
    });

    console.log("shareResp status:", shareResp.status);
    console.log("shareResp data:", JSON.stringify(shareResp.data, null, 2));

    const shareData = shareResp.data.data;
    const fileId = shareData.attributes.item_id;
    const shareLink = shareData.attributes.link;
    const directFileUrl = `https://storage.referloan.in/api/file/${fileId}`;

    console.log("uploadId", uploadId)
     console.log("fileId", fileId)
      console.log("shareLink", shareLink)
       console.log("fileUrl", directFileUrl);
       return { status: true, data: shareResp.data.data.attributes.link };

  } catch (error) {
    console.error('Error uploading image:', error.code, error.message);
    if (error.response) {
      console.error('response.status:', error.response.status);
      console.error('response.data:', error.response.data);
    }
    return { status: false, error: error.response?.data || error.message || 'Failed to upload image.' };
  }
};

export default uploadimage;
