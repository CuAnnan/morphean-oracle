'use strict';
import crypto from 'crypto';

const MAX_TTL_DEFAULT = 600000;
const TIMER_DURATION_DEFAULT = 1000;

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
    /**
     * A static reference to a Singleton instance of the OC
     * @type {ObjectCache}
     */
    static #instance = null;

    /**
     * The max lifetime of objects in the cache. When an ObjectCache's lifetime exceeds this, it's removed
     * @type {Number}
     */
    maxTTL;
    /**
     * How often the cache should run the checkCache method.
     * @type {Number};
     */
    timerDuration;
    /**
     * The dictionary of objectCacheEntities.
     * @type {Object.<string,ObjectCacheEntity>}
     */
    cache = {};
    /**
     * The number of things in the cache.
     * @type {Number};
     */
    size = 0;
    /**
     * Reference container for the timeOut.
     * @type {Number}
     */
    #timeout;

    constructor(maxTTL = MAX_TTL_DEFAULT, timerDuration = TIMER_DURATION_DEFAULT)
    {
        this.maxTTL = parseInt(maxTTL);
        this.timerDuration = parseInt(timerDuration);
        this.#timeout = setTimeout(()=>{this.checkCache();}, this.timerDuration);
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
     * This adds a second reference to the cache's dictionary with a different key, allowing the same instance to be referenced by multiple keys.
     * @param keyToLink
     * @param keyToLinkAs
     */
    link(keyToLink, keyToLinkAs)
    {
        if(this.cache[keyToLink] !== undefined)
        {
            this.cache[keyToLink].refresh();
            this.cache[keyToLinkAs] = this.cache[keyToLink];
        }
        this.size++;
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
        clearTimeout(this.#timeout);
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
        clearTimeout(this.#timeout);
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
        this.#timeout = setTimeout(() => {this.checkCache();}, this.timerDuration);
    }

    get debugJSON()
    {
        let debugJSON = {
            size:this.size,
            maxTTL:this.maxTTL,
            entries:{}
        };
        let now = Date.now();
        for(let [key, entry] of Object.entries(this.cache))
        {
            debugJSON.entries[key] = this.maxTTL - entry.since(now);
        }
        return debugJSON;
    }

    static initialise(maxTTL = MAX_TTL_DEFAULT)
    {
        this.#instance = new ObjectCache(maxTTL);
    }

    /**
     * @param maxTTL
     * @returns {ObjectCache}
     */
    static getInstance(maxTTL = MAX_TTL_DEFAULT)
    {
        if(this.#instance === null)
        {
            this.#instance = new ObjectCache(maxTTL);
        }
        return this.#instance;
    }

}

export default ObjectCache;