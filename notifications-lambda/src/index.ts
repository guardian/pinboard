exports.handler = async (event: any) => {
  event.Records.forEach((record: any) => console.log(record.dynamodb));
};
