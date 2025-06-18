const baseURL = import.meta.env.VITE_BASE_URL
export const getResume = async (referenceResume: String, jobDetails: String, accessToken: String) => {
    const url = baseURL + '/create-resume';
    const options : RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            referenceResume: referenceResume,
            jobDetails: jobDetails,
            accessToken: accessToken
        }),
    };

    console.log('preferred options:', options);

    const response = await fetch(url, options);
    return response.json(); 
}

export const getReferralMessage = async (referenceResume: String, jobDetails: String, accessToken: String) => {
    const url = baseURL + '/create-referral-message';
    const options : RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            referenceResume: referenceResume,
            jobDetails: jobDetails,
            accessToken: accessToken
        }),
    };
    const response = await fetch(url, options);
    return response.json(); 
}