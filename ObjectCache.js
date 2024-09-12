'use strict';
import crypto from 'crypto';

const MAX_TTL_DEFAULT = 60000;

function md5(data)
{
    return crypto.createHash('md5').update(data).digest("hex");
}

/**
 * The class to contain stored data
 */
class ObjectCacheEntity
{
    /**
     * The thing to be stored
     * @param entry
     */
    constructor(entry)
    {
        this.entry = entry;
        this.refresh();
    }

    /**
     * Update its last access time.
     */
    refresh()
    {
        this.lastAccessed = Date.now();
    }

    /**
     * Get its age
     * @returns {number} the number of milliseconds since it was last accessed
     */
    since(time)
    {
        return time - this.lastAccessed;
    }

    get age()
    {
        return this.since(Date.now());
    }
}

/**
 * A simple object cache
 */
class ObjectCache
{
    static #instance = null;
    constructor(maxTTL)
    {
        /*
         * the maximum life age of the items to be stored
         */
        this.maxTTL = maxTTL && !isNaN(maxTTL)?parseInt(maxTTL):MAX_TTL_DEFAULT;
        /*
         * A flat hash table to store the cached items in
         */
        this.cache = {};
        /*
         * A timed function to check the age of all items in the cache
         */
        this.timeout = setTimeout(()=>{this.checkCache();}, this.maxTTL);
        /*
         * The number of items in the cache
         */
        this.size = 0;
    }

    /**
     * Adds an item to the cache and sets the time it was last accessed at to now
     * @param key The key by which to store the object, or an object you want to store. A hash will be created of the object, by its properties.
     * @param object The object to store
     * @return {string} The key by which the item was stored in the cache
     */
    put(key, object)
    {
        if(key === undefined || object === undefined)
        {
            throw new Error('Invalid number of arguments');
        }

        if(typeof key !== "string")
        {
            throw new Error("Invalid key type");
        }

        /*
         * We already have this item. So we should refresh it and return its key
         */
        if(this.cache[key])
        {
            this.cache[key].refresh();
            return key;
        }

        /*
         * Add the item to the cache
         */
        this.cache[key] = new ObjectCacheEntity(object);

        /*
         * Increase the size
         */
        this.size++;

        /*
         * Return the key
         */

        return key;
    }

    /**
     * A helper function to add an object without deciding a key. For lazy people. Like me.
     * @param object The item to be cached
     * @returns {string} The key by which the item was stored.
     */
    add(object)
    {
        let key = md5(JSON.stringify(object));
        return this.put(key, object);
    }

    /**
     * Gets an item from the cache by its key and updates the time it was last accessed at
     * @param key
     * @returns {object} The object in the cache for the key. Or null if no entry found.
     */
    get(key)
    {
        if(this.cache[key] !== undefined)
        {
            this.cache[key].refresh();
            return this.cache[key].entry;
        }
        return null;
    }

    /**
     * Remove an item from the cache by its key and return it
     * @param key
     */
    remove(key)
    {
        let object;
        if(this.cache[key])
        {
            object = this.cache[key].entry;
            this.size --;
            delete this.cache[key];
        }
        return object;
    }

    /**
     * Clear all items from the cache
     */
    clear()
    {
        this.cache = {};
        this.size = 0;
    }

    /**
     * Empty out the cache and stop the timeout interval to allow clean shutting down.
     */
    destroy()
    {
        this.clear();
        clearTimeout(this.timeout);
    }

    /**
     * A helper function for clear
     */
    empty()
    {
        this.clear();
    }

    /**
     * Check the cache. This is done every this.maxTTL milliseconds via a timeout
     */
    checkCache()
    {
        clearTimeout(this.timeout);
        let removedItems = 0,
            now = Date.now();

        for (let i in this.cache)
        {
            if (this.cache[i].since(now) > this.maxTTL)
            {
                removedItems++;
                delete this.cache[i];
            }
        }
        this.size -= removedItems;
        this.timeout = setTimeout(() => {this.checkCache();}, this.maxTTL);
    }

    static getInstance(maxTTL)
    {
        if(this.#instance === null)
        {
            this.#instance = new ObjectCache(maxTTL);
        }
        return this.#instance;
    }

}

export default ObjectCache;