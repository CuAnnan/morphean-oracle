import {MongoClient} from 'mongodb';


class MongoConnectionFactory
{
    static #instantiated;

    static async init(conf)
    {
        if(!this.#instantiated)
        {
            MongoConnectionFactory.Instance = null;
            let mongoUrl = `mongodb://${conf.mongo.user}:${encodeURIComponent(conf.mongo.password)}@127.0.0.1:27017/${conf.mongo.db}?directConnection=true`;
            console.log(`Running initial connection on ${mongoUrl}`);
            MongoConnectionFactory.MongoClient = new MongoClient(mongoUrl);
            await MongoConnectionFactory.MongoClient.connect();
            MongoConnectionFactory.Instance = MongoConnectionFactory.MongoClient.db(conf.db);
            this.#instantiated = true;
        }
        return MongoConnectionFactory.Instance;
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