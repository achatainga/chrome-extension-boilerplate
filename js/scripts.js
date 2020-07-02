var nullOrundefined = variable => {
	console.log( variable );
	if ( typeof variable == undefined || typeof variable == "undefined" || typeof variable == null || typeof variable == "null" || variable == undefined || variable == "undefined" || variable == null || variable == "null" ) {
		console.log( "Null or undefined" );
		return true;
	} else {
		return false;
	}
}