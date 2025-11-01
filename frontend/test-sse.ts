const source = new EventSource('http://localhost:3000/v1/sessions/start?camera=0');
source.addEventListener('status', (event) => {
  console.log('status', event.data);
});
source.addEventListener('metrics', (event) => {
  console.log('metrics', event.data);
});
source.onerror = (error) => {
  console.error('SSE error', error);
};
