$( document ).ready( function() {
    $( ".deal_code" ).on( "click", function() {
        event.preventDefault();
        console.log( "clicked" );
        copyTextToClipboard( $( this ).attr( "deal_code" ) );
        $( this ).html( "Copied" );
        setTimeout( function(){ element.html( deal_code ) }, 3000 );
    } );
    
     $( ".login" ).on( "click", function() {
        event.preventDefault();
        console.log( "clicked" );
        window.open( $( "#login" ).attr( "href" ) );         
     } );

     $( ".deal_link" ).on( "click", function() {
        window.open( $( this ).attr( "href" ) );
    } );
} );
