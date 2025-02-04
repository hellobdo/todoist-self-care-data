const scriptProperties = PropertiesService.getScriptProperties();
const apiToken = scriptProperties.getProperty('apiToken');
  
// Main function to run daily
function DailyHabitTracker() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Date calculations (UTC timezone)
  const today = new Date();
  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(today.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0); // Start of yesterday
  
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setDate(yesterdayStart.getDate() + 1); // End of yesterday

  // Convert to ISO strings for comparison
  const isoStart = yesterdayStart.toISOString();
  const isoEnd = yesterdayEnd.toISOString();

  const params = {
    method: 'post',
    headers: {'Authorization': `Bearer ${apiToken}`},
    payload: JSON.stringify({
      token: apiToken,
      since: isoStart,
      until: isoEnd
    })
  };

  const apiUrl = 'https://api.todoist.com/sync/v9/completed/get_all';

  const response = UrlFetchApp.fetch(apiUrl, params);
  
  if (response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText());
    const filtered = data.items.filter(task => 
      task.content.match(/meditation|breathing/i) &&
      task.completed_at >= isoStart &&
      task.completed_at < isoEnd
    );

    if (filtered.length > 0) {
      filtered.forEach(task => {
        sheet.appendRow([
          task.task_id,
          task.content,
          task.completed_at.split('T')[0],
          new Date().toISOString().split('T')[0] // Capture date
        ]);
      });
      Logger.log(`Added ${filtered.length} tasks for ${isoStart.split('T')[0]}`);
    } else {
      Logger.log('No matching tasks yesterday');
    }
  }
}

// Create daily trigger (run once)
function CreateDailyTrigger() {
  ScriptApp.newTrigger('DailyHabitTracker')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 9 AM daily
    .create();
}