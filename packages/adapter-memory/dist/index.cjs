Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/index.ts
var MemoryDatabaseAdapter = class {
	store = {};
	/**
	* Helper method to load the initial JSON data into memory
	*/
	loadData(initialData) {
		this.store = initialData;
	}
	hasRef(obj) {
		return obj && typeof obj === "object" && "ref" in obj;
	}
	getRefs(obj) {
		const details = {};
		for (const [key, value] of Object.entries(obj)) if (this.hasRef(value)) details[key] = [{
			ref: value.ref,
			id: value.id
		}];
		else if (Array.isArray(value) && value.length > 0 && this.hasRef(value[0])) details[key] = value.map((item) => ({
			ref: item.ref,
			id: item.id
		}));
		return details;
	}
	findById(collection, id) {
		const items = this.store[collection] || [];
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) throw new Error(`Item with id '${id}' not found in '${collection}'`);
		return {
			item: items[index],
			index
		};
	}
	async getAll(collection) {
		return (this.store[collection] || []).map((item) => {
			const clonedItem = { ...item };
			const refs = this.getRefs(clonedItem);
			for (const refField of Object.keys(refs)) {
				const refObjArr = [];
				refs[refField].forEach(({ id: refId, ref }) => {
					const refItems = this.store[ref] || [];
					if (refId) {
						const refObj = refItems.find((i) => i.id === refId);
						if (refObj) refObjArr.push(refObj);
					} else {
						const relevantItems = refItems.filter((refItem) => {
							const backRefs = this.getRefs(refItem);
							return Object.values(backRefs).some((refArr) => refArr.some((br) => br.ref === collection && br.id === clonedItem.id));
						});
						refObjArr.push(...relevantItems);
					}
				});
				clonedItem[refField] = refObjArr;
			}
			return clonedItem;
		});
	}
	async getById(collection, id) {
		const { item } = this.findById(collection, id);
		return item;
	}
	async search(collection, query) {
		return (this.store[collection] || []).filter((item) => {
			return Object.keys(query).every((searchKey) => query[searchKey] === item[searchKey]);
		});
	}
	async create(collection, data) {
		if (!this.store[collection]) this.store[collection] = [];
		const newItem = {
			id: `${Date.now()}`,
			...data
		};
		this.store[collection].push(newItem);
		return newItem;
	}
	async update(collection, id, data) {
		const { item, index } = this.findById(collection, id);
		const updatedItem = {
			...item,
			...data,
			id
		};
		this.store[collection][index] = updatedItem;
		return updatedItem;
	}
	async delete(collection, id) {
		const { item, index } = this.findById(collection, id);
		this.store[collection].splice(index, 1);
		return item;
	}
};
//#endregion
exports.MemoryDatabaseAdapter = MemoryDatabaseAdapter;
