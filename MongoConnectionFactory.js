import {MongoClient} from 'mongodb';

class MongoConnectionFactory
{
    static async init(conf)
    {
        if(typeof MongoConnectionFactory.Instance == "undefined")
        {
            MongoConnectionFactory.Instance = null;
            console.log("Running initial connection");
            let mongoUrl = `mongodb://${conf.mongo.user}:${encodeURIComponent(conf.mongo.password)}@127.0.0.1:27017/${conf.mongo.db}?directConnection=true`;
            MongoConnectionFactory.MongoClient = new MongoClient(mongoUrl);
            await MongoConnectionFactory.MongoClient.connect();
            MongoConnectionFactory.Instance = MongoConnectionFactory.MongoClient.db(conf.db);
        }
    }

    static getInstance()
    {
        if(!MongoConnectionFactory.Instance)
        {
            throw new Error('No instance of the connection created');
        }
        return MongoConnectionFactory.Instance;
    }

    static async close()
    {
        await MongoConnectionFactory.MongoClient.close();
        delete MongoConnectionFactory.MongoClient;
        delete MongoConnectionFactory.Instance;
    }
}



export default MongoConnectionFactory;