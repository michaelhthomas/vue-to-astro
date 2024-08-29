<template>
	<h1>Hello World</h1>

	<h2 v-if="condition">Good morning!</h2>
	<h3 v-else>Good night.</h3>

	<div v-for="n in 10">
		<h1>Item {{ n }}</h1>
	</div>
</template>
