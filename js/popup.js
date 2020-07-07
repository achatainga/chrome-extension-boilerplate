var helpers = chrome.extension.getBackgroundPage();
$( document ).ready( function() {
    chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
        var currentTab = tabs[ 0 ];
        // console.log( tabs );
        chrome.storage.local.get( "token", async function( token ) {
            var token = ( !nullOrundefined( token.token ) && !isEmpty( token.token ) ) ? token.token : {};
            chrome.runtime.sendMessage( { host: extractHostname( currentTab.url ), token: token, action: "get_data_from_api" }, async function( response ) {
                if ( response == undefined || Object.keys( response ).length == 0 ) { return };
                console.log( response );
                // if ( !nullOrundefined( response ) && !isEmpty( response ) && !nullOrundefined( response[ 0 ] ) && !nullOrundefined( response[ 1 ] ) ) {
                //     var is_login = helpers.is_login( response );
                //     var html = ``;
                //     if ( !is_login ) {
                //         html = `
                //             <li class="nav-item">
                //                 <a class="nav-link" href="https://couponifier.com/login.php"><i class="fas fa-sign-in-alt    "></i> Login</a>
                //             </li>
                //             <li class="nav-item">
                //                 <a class="nav-link" href="https://couponifier.com/register.php"><i class="fas fa-user-plus" aria-hidden="true"></i> Register</a>
                //             </li>
                //         `;
                //     } else {
                //         html = `
                //             <li class="nav-item dropdown">
                //                 <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
                //                     <!-- <img src="<?php //echo HOST_PATH; ?>/images/avatar_male.png" alt="..." class="rounded" style="max-width: 42px"> -->
                //                     User
                //                 </a>
                //                 <div class="dropdown-menu dropdown-menu-right">
                //                     <a class="dropdown-item" href="https://couponifier.com/profile.php"><i class="fas fa-user    "></i> Profile</a>
                //                     <a class="dropdown-item" href="https://couponifier.com/settings.php"><i class="fas fa-cog    "></i> Settings</a>
                //                     <a class="dropdown-item" href="https://couponifier.com/chat.php"><i class="fas fa-comment    "></i> Chat</a>
                //                 </div>
                //             </li>
                //         `;
                //     }
                //     $( "#nav_user" ).append( html );
                //     var deals = response[ 0 ];
                //     var user = response[ 1 ];
                //     deals_html = helpers.print_deals( deals );
                //     user_html = helpers.print_user( user );
                //     $( "#user" ).append( user_html );
                //     $( "#deals" ).append( deals_html );
                //     console.log( is_login );
                //     handle_load();
                // }
            } );
        } );
    } );
} );
window.addEventListener( "load", () => {
    
} );

function handle_load() {
    $( document ).ready( function() {
        document.getElementById( 'body' ).style.minWidth = "450px";
        $( "#loader" ).remove();
        // console.log( "I am ready" );
        $( ".deal_code" ).on( "click", function() {
            var element = $( this );
            var deal_code = $( this ).attr( "deal_code" );
            copyTextToClipboard( $( this ).attr( "deal_code" ) );
            $( this ).html( "Copied" );
            setTimeout( function(){ element.html( deal_code ) }, 3000 );
        } )
        $( ".link" ).on( "click", function() {
            window.open( $( this ).attr( "href" ) );
        } );
    } );
}

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}