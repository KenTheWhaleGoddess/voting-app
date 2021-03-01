import React,{Component} from 'react';
import './App.css';
import Amplify, {Analytics, AWSKinesisFirehoseProvider } from 'aws-amplify';
import config from './aws-exports'

import DynamoDB from 'aws-sdk'



Amplify.configure({
  Auth: {
    identityPoolId: config.aws_cognito_identity_pool_id,
    region: config.aws_project_region
  },
  Analytics: {
    AWSKinesisFirehose: {
      region: config.aws_project_region
    }
  }
});

const ddb = new DynamoDB.DocumentClient();



function record(language, event) {
    return ddb.put({
        TableName: 'cakebops-kinesis-table',
        Item: {
            language: language,
            val: event,
            RequestTime: new Date().toISOString(),
        },
    }).promise();
}



function get(language) {
	 var params = {
		  Key: {
		   "language": {
		     S: language
		    }
		  }, 
		  TableName: "cakebops-kinesis-table"
		 };
    return ddb.getItem(params).val;
}

Analytics.addPluggable(new AWSKinesisFirehoseProvider());

class App extends Component{
	constructor(props){
		super(props);
		this.state = {
			languages : [
				{name: "Mila", votes: get("Mila")},
				{name: "Ken", votes: get("Ken")},
				{name: "Peppa", votes: get("Peppa")},
			]
		}
	}

	vote (i) {
		let newLanguages = [...this.state.languages];
		newLanguages[i].votes++;
		function swap(array, i, j) {
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		this.setState({languages: newLanguages});
    
    const now = new Date();

    let data = {
      id: now.getTime(),
      language: newLanguages[i].name
    }

    Analytics.record({
      data: data,
      streamName: config.aws_firehose_name
    }, 'AWSKinesisFirehose');
	}

	render(){
		return(
			<>
				<h1>Vote Your Language!</h1>
				<div className="languages">
					{
						this.state.languages.map((lang, i) => 
							<div key={i} className="language">
								<div className="voteCount">
									{lang.votes}
								</div>
								<div className="languageName">
									{lang.name}
								</div>
								<button onClick={record(lang.name, i)}>Click Here</button>
							</div>
						)
					}
				</div>
			</>
		);
	}
}
export default App;