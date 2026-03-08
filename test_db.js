db.job.findMany({ orderBy: { createdAt: "desc" }, take: 1 }).then(console.log)
