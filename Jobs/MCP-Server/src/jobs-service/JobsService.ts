import dotenv from 'dotenv';

dotenv.config({path: '.env.production'});

const baseUrl = process.env.JOBS_BASE_API_URL;
const apiKey = process.env.JOBS_API_KEY_PREM;

export interface JobDetails {
    jobId: string;
    jobTitle: string;
    jobDescription?: string;
    companyName: string;
    jobUrl: URL;
    skills?: string[];
    location: string;
}

function jobDataFormatter(data: any): JobDetails[]{
    //console.log("Data we got:", data);
    if(Array.isArray(data)){
        let items: any[] = data;
        let jobsDetails: JobDetails[] = [];
        for(let i=0; i<items.length; i++){
            const jobDetails: JobDetails = {
                jobId: '-',
                jobTitle: items[i]['title'],
                jobDescription: items[i]['description'],
                companyName: items[i]['companyDetails']['name'],
                jobUrl: items[i]['jobPostingUrl'],
                skills: items[i]['skillsDescription'],
                location: '-'
            }
            jobsDetails.push(jobDetails);
        }
        return jobsDetails;
    }
    return [];
}

function jobDataFormatterV2(data: any): JobDetails[]{
    //console.log("Data we got:", data);
    if(Array.isArray(data)){
        let items: any[] = data;
        let jobsDetails: JobDetails[] = [];
        for(let i=0; i<items.length; i++){
            const jobDetails: JobDetails = {
                jobId: items[i]['id'],
                jobTitle: items[i]['title'],
                jobDescription: '-',
                companyName: items[i]['company']['name'],
                jobUrl: items[i]['url'],
                skills: [],
                location: items[i]['location']
            }
            jobsDetails.push(jobDetails);
        }
        return jobsDetails;
    }
    return [];
}

export async function getJobsList(role: string, location: string, date_posted: string): Promise<JobDetails[]> {
    if (!apiKey) {
        throw new Error("RAPIDAPI_KEY is not defined");
    }

    const encodedRole = encodeURIComponent(role);
    const encodedLocation = encodeURIComponent(location);
    const encodedDatePosted = encodeURIComponent(date_posted);
    console.log('API called to get job details!')

    const url = `${baseUrl}?keyword=${encodedRole}&location=${encodedLocation}&dateSincePosted=${encodedDatePosted}`;

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'linkedin-job-api.p.rapidapi.com'
        },
    };

    const jobsResponse = await fetch(url, options);
    const jobResponseData = await jobsResponse.json();
    console.log('Jobs Response:', jobResponseData);
    return jobDataFormatter(jobResponseData.data);
    //return  jobDataFormatter(dummyData.data);
}


export async function getJobsListV2(role: string, location: string, date_posted: string): Promise<JobDetails[]> {
    if (!apiKey) {
        throw new Error("RAPIDAPI_KEY is not defined");
    }

    console.log('Role:', role, ', location:', location, ', date posted:', date_posted);
    const encodedRole = encodeURIComponent(role);
    const encodedLocation = encodeURIComponent(location);
    const encodedDatePosted = encodeURIComponent(date_posted);
    console.log('API called to get job details!')

    //Search for location
    //if locations array is empty throw an error
    //Take the first location from the array
    const urlForLocations = baseUrl + '/search-locations?keyword=' + encodedLocation;
    const optionsForLocations = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com'
        },
    }

    const responseForLocation = await fetch(urlForLocations, optionsForLocations);
    const dataForLocations = await responseForLocation.json();
    if(!(dataForLocations.success as boolean)){
        throw new Error('Facing issues in finding locations.')
    }
    const locationId = dataForLocations.data.items[0].id;
    console.log('Locations ID for searching:', locationId);
    const locationIdFiltered = locationId.match(/\d+/);
    //Search for jobs according to given parameters
    const urlForJobSearch = baseUrl + '/search-jobs-v2?keywords=' + encodedRole + '&locationId=' + locationIdFiltered + '&datePosted=' + encodedDatePosted;
    const optionsForJobSearch = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com'
        },
    }
    const responseForJobs = await fetch(urlForJobSearch, optionsForJobSearch);
    const dataForJobs = await responseForJobs.json();
    if(!dataForJobs.success){
        throw new Error('Facing issues in finding jobs.')
    }

    const data = jobDataFormatterV2(dataForJobs.data);
    console.log('Jobs we got:', data);
    return data;
}

export async function getJobDetails(jobId: string): Promise<JobDetails> {
    if (!apiKey) {
        throw new Error("RAPIDAPI_KEY is not defined");
    }
    const urlForJobDetails = baseUrl + '/get-job-details?id=' + jobId;
    const optionsForJobSearch = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com'
        },
    }

    const response = await fetch(urlForJobDetails, optionsForJobSearch);
    const data = await response.json();
    console.log('Response got from server for job details:', data);
    const jobDetails = data.data;
    return {
        jobId: jobDetails.id,
        jobTitle: jobDetails.title,
        jobDescription: jobDetails.description,
        companyName: jobDetails.company.name,
        jobUrl: jobDetails.url,
        location: jobDetails.location
    } as JobDetails
}