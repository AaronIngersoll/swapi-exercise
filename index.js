const express = require("express");
const request = require("request");
const cors = require("cors");
const app = express();
const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));

app.use(cors());

app.get("/people", findSWchars, jsonResponse);

app.get("/planets", findSWPlanets, jsonResponse);

function findSWchars(req, res, next) {
	const url = "https://swapi.dev/api/people";
	request(url, handleApiResponse(url, (context = "people"), res, next));
}

function findSWPlanets(req, res, next) {
	const url = `https://swapi.dev/api/planets/`;
	request(url, handleApiResponse(url, (context = "planets"), res, next));
}

async function getChars(url) {
	const baseUrl = `${url}/?format=json&page=`;
	console.log("baseUrl", baseUrl);
	let page = 1;
	let people = [];
	let lastResult = [];
	do {
		try {
			const resp = await fetch(`${baseUrl}${page}`);
			const data = await resp.json();
			lastResult = data;
			data.results.forEach((person) => {
				const { name, height, films } = person;
				people.push({ name, height, films });
			});
			page++;
		} catch (err) {
			// console.error(`Oops, something is wrong @${url} ${err}`);
		}
	} while (lastResult.next !== null);
	return people;
}

function handleApiResponse(url, context = "people", res, next) {
	console.log(url);
	return async (err, response, body) => {
		if (err || body[0] === "<") {
			res.locals = {
				success: false,
				error: err || "Invalid request.",
			};
			return next();
		}

		const results =
			context === "people" ? await getChars(url) : JSON.parse(body);

		res.locals = {
			success: true,
			results: results,
		};

		return next();
	};
}

function jsonResponse(req, res, next) {
	return res.json(res.locals);
}

const server = app.listen(3000, () => {
	const host = server.address().address,
		port = server.address().port;

	console.log("API listening at http://%s:%s", host, port);
});
