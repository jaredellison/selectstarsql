// Set up DB
window.onload = loaddata;
function loaddata() {
  const dataset_location = 'data/dataset.csv';
  alasql.promise(`
  DROP TABLE IF EXISTS executions;

  CREATE TABLE executions (
    first_name STRING,
    last_name STRING,
    race STRING,
    weight INT,
    age INT,
    race STRING,
    execution_number INT,
    execution_date DATE,
    last_statement STRING
    );

  SELECT 
    [First Name] AS first_name, 
    [Last Name] AS last_name, 
    Race as race, 
    Weight AS weight,
    [Age at Execution] AS age,
    Race as race,
    Execution AS execution_number,
    [Execution Date] AS execution_date,
    [Last Statement] AS last_statement
  INTO executions
  FROM CSV("` + dataset_location + `", {headers:true, separator:","});
  `)
  .then(function(data) {console.log(data[2] + " rows successfully loaded!");})
  .catch(function(err) {console.log("Error: " + err);})
}

function query(sql) {
  // get data as array of javascript objects
  try {
    return alasql.exec(sql);
  } catch (e) {
    throw new Error(e.message);
  }
}

function datatable (data) {
  var tbl = document.createElement("table");
  tbl.className = 'datatable'
  
  // create header row
  var thead = tbl.createTHead();
  var header_labels = Object.keys(data[0]);
  var row = thead.insertRow(0); 
  for (var idx in header_labels) {    
    var cell = row.insertCell(idx);
    cell.innerHTML = header_labels[idx];
  }
  
  // fill table body
  var tbody = document.createElement("tbody");
  for (var row_idx in data) {
    var body_row = tbody.insertRow();
    for (var header_idx in header_labels) {
      var body_cell = body_row.insertCell();
      body_cell.appendChild(document.createTextNode(data[row_idx][header_labels[header_idx]]));
    }
  }
  tbl.appendChild(tbody);
  return tbl;
}

// SQL Exercise Component
class sqlExercise extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    var question = this.getAttribute('data-question') || '';
    var comment = this.getAttribute('data-comment') || '';
    var defaultText = this.getAttribute('data-default-text') || '';
    var solution = this.getAttribute('data-solution') || '';
    
    var homeDiv = document.createElement('div');
    homeDiv.className = 'sqlExHomeDiv';
    
    if (question) {
      var caption = document.createElement('div');
      caption.className = 'sqlExQuestion';
      caption.textContent = question;
      homeDiv.appendChild(caption);
    }
    
    if (comment) {
      var commentbox = document.createElement('div');
      commentbox.className = 'sqlExComment';
      commentbox.textContent = comment;
      homeDiv.appendChild(commentbox);
    }
    
    var form = document.createElement('form');
    
    // Input Area
    var inputArea = document.createElement('div');
    inputArea.className = 'sqlExInputArea';
    
    var textArea = document.createElement('textarea');
    textArea.textContent = defaultText;
    textArea.name = 'input';
    inputArea.appendChild(textArea);
    
    var editor = CodeMirror.fromTextArea(textArea, {
      mode: 'text/x-sql',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      textWrapping: false,
      autofocus: true,
      autoRefresh: true,    
      theme: 'neat',
      viewportMargin: Infinity
    });
    
    editor.setSize('100%', 'auto');
    editor.refresh();
    
    var runButton = document.createElement('input');
    runButton.type = 'submit';
    runButton.value = 'Run';
    inputArea.appendChild(runButton); 

    form['onsubmit'] = (e) => {
      e && e.preventDefault();
      try {
        var result_data = query(editor.getValue());
        var correct_data = query(solution);
        var verdict = _.isEqual(result_data, correct_data) ? "Correct" : "Incorrect";
        // http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
        var result_div = document.createElement('div');
        result_div.className = 'returnOkay';
        var verdict_div = document.createElement('div');
        verdict_div.innerText = verdict;
        result_div.appendChild(verdict_div);
        result_div.appendChild(datatable(result_data));
      } catch (e) {
        var result_div = document.createElement('div');
        result_div.className = 'returnError';
        result_div.innerText = e.message;
      }
      outputBox.innerHTML = '';
      outputBox.appendChild(result_div);
    };
    
    var solutionButton = document.createElement('input');
    solutionButton.name = 'solution';
    solutionButton.type = 'button';
    solutionButton.value = 'Show Solution';
    solutionButton.onclick = (e) => {
      var existingCode = editor.getValue();
      editor.setValue(existingCode + "\n-- " + solution);
    };
    inputArea.appendChild(solutionButton);
    
    var resetButton = document.createElement('input');
    resetButton.type = 'button';
    resetButton.value = 'Reset';
    resetButton.onclick = (e) => {
      editor.setValue(defaultText);
      outputBox.textContent = '';
    };
    inputArea.appendChild(resetButton);
    form.appendChild(inputArea);
    
    // Output Area
    var outputArea = document.createElement('div');
    outputArea.className = 'sqlExOutputArea';
    
    var outputBox = document.createElement('output');
    outputBox.name = 'output';
    outputArea.appendChild(outputBox);
    form.appendChild(outputArea);
    
    homeDiv.appendChild(form);
    this.appendChild(homeDiv);
  }
}

customElements.define('sql-exercise', sqlExercise);
