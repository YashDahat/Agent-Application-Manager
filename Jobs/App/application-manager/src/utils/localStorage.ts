export function setItem(key: string, value: unknown) {
    try{
        console.log('SET: Items to key:', key, ', Items to value:', value);
        window.localStorage.setItem(key, JSON.stringify(value));
    }catch (error){
        console.log('Error in local storage:', error);
    }
}

export function getItem(key: string){
    try{
        const item = window.localStorage.getItem(key)
        if(item){
            console.log('GET: Items to key:', key, ', Items to value:', item);
            return JSON.parse(item);
        }
        return undefined;
    }catch(error){
        console.log('Error in local storage:', error);
    }
}