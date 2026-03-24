export default defineEventHandler(async event => {
  const { key } = getQuery<{ key: string }>(event);
  if (key && key === process.env.DEBUG_KEY) {
    return { message: 'In-memory cookie cache has been removed. Auth data is stored in KV only.' };
  } else {
    return 'not set debug key';
  }
});
