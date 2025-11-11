// Test script for draft functionality
// Run this in the browser console on the /new-review page

// Test draft manager
console.log('Testing draft manager...');

// Test saving a draft
const testState = {
  qaData: [{ id: 'test-1', station: 'TEST-001', issueType: 'OK' }],
  cuLookup: [{ code: 'CU-001', description: 'Test CU' }],
  fileName: 'test.xlsx',
  kmzPlacemarks: [],
  kmzFileName: '',
  pdfFileName: '',
  stationPageMapping: {},
  stationSpecMapping: {},
  editedSpecMapping: {},
  placemarkNotes: {},
  mapDrawings: [],
  pdfAnnotations: new Map(),
  pdfWorkPointNotes: {},
  selectedStation: 'TEST-001',
  currentPdfPage: 1,
  activeTab: 'dashboard',
  googleApiKey: '',
};

console.log('Saving test draft...');
// window.draftManager.saveDraftImmediately(testState);

console.log('Checking if draft exists...');
// const hasDraft = window.draftManager.hasDraft();
// console.log('Has draft:', hasDraft);

console.log('Loading draft...');
// const loadedDraft = window.draftManager.loadDraft();
// console.log('Loaded draft:', loadedDraft);

console.log('Draft manager test complete!');
