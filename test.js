const res = { data: { count: 1, results: [{ id: 1 }] } }
console.log(res.data.results || res.data)
