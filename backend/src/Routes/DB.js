const MongoClient = require("mongodb")
const Evaluate = require("../Algorithms/EvaluateQuiz")
const ObjectId = require("mongodb").ObjectId

let db
const DBStart = async () => {
	console.log("DB server connecting...")
	const client = await MongoClient.connect(
		"mongodb://quizdom:quizdom-mongodb@cluster0-shard-00-00.lecax.mongodb.net:27017,cluster0-shard-00-01.lecax.mongodb.net:27017,cluster0-shard-00-02.lecax.mongodb.net:27017/quizdom-project?ssl=true&replicaSet=atlas-hmlbn7-shard-0&authSource=admin&retryWrites=true&w=majority",
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}
	)
	console.log("DB Connected Successfully.")
	db = client.db("quizdom-project")
}
DBStart()
const withDB = async (operations, res) => {
	try {
		await operations(db)
		// client.close()
	} catch (error) {
		res.status(500).json({ message: "Error Connecting to db ", error })
	}
}

const createUser = async (uid, name, res) => {
	await withDB(async (db) => {
		const user = await db.collection("users").findOne({ uid: uid })
		if (!user) {
			const result = await db.collection("users").insertOne({
				uid,
				name,
				createdQuiz: [],
				attemptedQuiz: [],
			})
			res.status(200).json({ message: "User Created successfully." })
		} else {
			res.status(200).json({ message: "User Record Exist" })
		}
	})
}

createQuiz = async (quiz, res) => {
	try {
		await withDB(async (db) => {
			quiz["responses"] = []
			const result = await db.collection("quizzes").insertOne(quiz)
			res.status(200).json({
				message: "Quiz created successfully",
				quizId: result.insertedId,
			})
			console.log("quiz ID", result.insertedId)
			const query = { uid: quiz.uid }
			const addQuiz = {
				$push: { createdQuiz: { quizId: result.insertedId } },
			}
			await db.collection("users").updateOne(query, addQuiz)
			console.log("Quiz Added to Creator Document: ", result.insertedId)
		})
	} catch (error) {
		res.status(200).json({ message: "Error creating quiz", error })
		console.log("Error : ", error)
	}
}

submitQuiz = async (submittedQuiz, res) => {
	withDB(async (db) => {
		try {
			console.log("in the submit try: ", submittedQuiz)
			const cursor = db
				.collection("quizzes")
				.find({ _id: new ObjectId(submittedQuiz.quizId) })
				.project({ questions: 1 })
			const quiz = await cursor.toArray()
			const score = Evaluate(quiz[0].questions, submittedQuiz.questions)
			res.status(200).json({ score })
			await db.collection("quizzes").updateOne(
				{ _id: submittedQuiz.quizId },
				{
					$push: {
						responses: { uid: submittedQuiz.uid, score: score },
					},
				}
			)
			await db.collection("users").updateOne(
				{ uid: submittedQuiz.uid },
				{
					$push: {
						attempedQuiz: { quizId: submittedQuiz.quizId },
					},
				}
			)
		} catch (e) {
			console.log("Error:", e)
		}
	})
}

module.exports.withDB = withDB
module.exports.createUser = createUser
module.exports.createQuiz = createQuiz
module.exports.submitQuiz = submitQuiz
