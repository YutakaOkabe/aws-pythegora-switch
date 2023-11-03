import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';

// AWS S3の設定
const S3_BUCKET = 'aws-pythagora-switch';
const REGION = 'ap-northeast-1';

AWS.config.update({
  accessKeyId: 'XXXXX',
  secretAccessKey: 'XXXX'
});

// DynamoDBオブジェクトを初期化
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: REGION // 同じリージョンを指定
});

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [keyValue, setKeyValue] = useState('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const fetchData = async () => {
        const params = {
          TableName: "outputs",
          KeyConditionExpression: "uuuid = :uuuid",
          ExpressionAttributeValues: {
            ":uuuid": "japanese_key"
          },
          Limit: 1
        };

        try {
          const data = await dynamoDb.query(params).promise();
          if (data.Items.length > 0) {
            setKeyValue(data.Items[0].key);
          } else {
            console.log("検索結果はありません。");
            setKeyValue(''); // 既存の値をクリア
          }
        } catch (error) {
          console.error("データの取得に失敗しました", error);
        }
      };

      fetchData();
    }, 5000); // 5秒ごとに実行

    // クリーンアップ関数
    return () => clearInterval(intervalId);
  }, []);

  const handleFileInput = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadFile = () => {
    const params = {
      Body: selectedFile,
      Bucket: S3_BUCKET,
      Key: selectedFile.name
    };

    myBucket.putObject(params)
      .on('httpUploadProgress', (evt) => {
        // アップロードの進行状況を表示
        console.log(`Uploaded: ${evt.loaded} / ${evt.total}`);
      })
      .send((err) => {
        if (err) console.log(err);
        else console.log('Successfully uploaded file.');
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileInput} />
      <button onClick={uploadFile} disabled={!selectedFile}>
        Upload to S3
      </button>
      {/* DynamoDBから取得した値を表示 */}
      {keyValue && <h1 style={{ color: 'red', fontSize: '48px', marginTop: '20px' }}>{keyValue}</h1>}
    </div>
  );
};

const myBucket = new AWS.S3({
  params: { Bucket: S3_BUCKET },
  region: REGION,
});

export default Upload;
