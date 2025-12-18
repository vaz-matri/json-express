function hasRef(obj) {
    return obj && typeof obj === 'object' && 'ref' in obj && 'id' in obj
}

// export function getRefs(obj) {
//     const details = {}
//
//     for (const [key, value] of Object.entries(obj)) {
//         if (hasRef(value)) {
//             details[key] = { ref: value.ref, id: value.id }
//         }
//     }
//
//     return details
// }

export function getRefs(obj) {
    const details = {}

    for (const [key, value] of Object.entries(obj)) {
        if (hasRef(value)) {
            // Single reference object
            details[key] = [{ ref: value.ref, id: value.id }]
        } else if (Array.isArray(value) && value.length > 0 && hasRef(value[0])) {
            // Array of reference objects
            details[key] = value.map(item => ({ ref: item.ref, id: item.id }))
        }
    }

    return details
}

// const details = getRefIdFieldDetails(album)
// console.log(details)
// { artist: { ref: 'artists', id: 'artist-001' } }
