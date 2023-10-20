import {PrismaClient} from '@prisma/client'
import {createPasswordHash} from '~/utils/misc.server'

const db = new PrismaClient()
/**
 * Cricket teams and stadiums are seeded from the data in the seed.ts file.
 */
async function seed() {
	await db.admin.deleteMany()
	await db.audience.deleteMany()
	await db.timeSlot.deleteMany()
	await db.stadium.deleteMany()
	await db.team.deleteMany()
	await db.zone.deleteMany()
	await db.ticket.deleteMany()

	const [] = await Promise.all([
		db.admin.create({
			data: {
				name: 'Michelle',
				email: 'admin@app.com',
				password: await createPasswordHash('password'),
			},
		}),
		db.audience.create({
			data: {
				name: 'John Doe',
				email: 'customer@app.com',
				phoneNo: '1234567890',
				address: '123, Main Street, Mumbai',
				password: await createPasswordHash('password'),
			},
		}),
		db.team.create({
			data: {
				name: 'Mumbai Indians',
				abbr: 'MI',
			},
		}),
		db.team.create({
			data: {
				name: 'Chennai Super Kings',
				abbr: 'CSK',
			},
		}),
		db.stadium.create({
			data: {
				name: 'Wankhede Stadium',
				abbr: 'ws',
				zones: {
					createMany: {
						data: [
							{
								name: 'Zone A',
								pricePerSeat: 100,
								size: 1000,
							},
							{
								name: 'Zone B',
								pricePerSeat: 200,
								size: 2000,
							},
						],
					},
				},
			},
		}),
	])

	await db.team.createMany({
		data: seedTeams,
	})

	await db.stadium.create({
		data: {
			name: 'Feroz Shah Kotla',
			abbr: 'fsk',
			zones: {
				createMany: {
					data: [
						{
							name: 'Zone A',
							pricePerSeat: 100,
							size: 1000,
						},
						{
							name: 'Zone B',
							pricePerSeat: 200,
							size: 2000,
						},
					],
				},
			},
		},
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await db.$disconnect()
	})

const seedTeams = [
	{
		name: 'Kolkata Knight Riders',
		abbr: 'KKR',
	},
	{
		name: 'Royal Challengers Bangalore',
		abbr: 'RCB',
	},
	{
		name: 'Delhi Capitals',
		abbr: 'DC',
	},
	{
		name: 'Sunrisers Hyderabad',
		abbr: 'SRH',
	},
]
