var helpers = chrome.extension.getBackgroundPage();
initialize();
function initialize() {
    $( document ).ready( function() {
        chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
            var currentTab = tabs[ 0 ];
            var parsed = psl.parse( helpers.extractHostname( currentTab.url ) );
            $( '#couponifier_iframe' ).attr( 'src', 'https://couponifier.com/ext_store.php?link=' + parsed.domain + '&header_no=true&footer_no=true' );
            handle_load();
        } );
    } );
}


function handle_load() {
    window.addEventListener( "load", () => {
        console.log( "window load" )
        var myIframe = document.getElementById( "couponifier_iframe" )
        myIframe.addEventListener( "load", () => {
            console.log( "iframe loaded" );
            console.log( this.contentWindow.document.body.getElementsByClassName( "copy" ) );
        } );
        Array.prototype.forEach.call( document.getElementById( "couponifier_iframe" ).contentWindow.document.body.getElementsByClassName( "copy" ), function( element ) {
            element.addEventListener( "click", ( event ) => {
                event.preventDefault();
                copyTextToClipboard( event.target.previousElementSibling.innerHTML );
            } );
            // Do stuff here
            console.log( element.tagName );
        } );
        console.log( document.getElementById( "couponifier_iframe" ).contentWindow.document.body.getElementsByClassName( "copy" ) );
    } );
}

var print_flash = ( message, type ) => {
    var flash = $( "#flash" );
    if ( flash.length > 0 ) {
        flash.remove();
    }
    var types = {
        'success': 'success',
        'error': 'danger',
        'danger': 'danger',
        'info': 'info',
        'primary': 'info',
        'secondary': 'warning',
        'warning': 'warning',
        'default': 'primary'
    }
    var xxx = 
    ( type == "success" ? `success` : 
        ( type == "info" ? `info`: 
            ( type == "warning" ? "warning" : "" )
        )
    )
    var html =
    `
    <div id="flash">
        <div class="flash alert alert-`
            + ( types[ type ] || types[ 'default' ] )+ ` alert-dismissible fade show mt-1" role="alert"
            style="
                position: fixed;
                right: 0px;
                display: none;
                z-index: 1
            "
        >
            <strong>
            </strong> ` + message + `
        </div>
    </div>
    `;
    $( html ).insertAfter( "header" );
    flash = $( ".flash" );
    var header_height = $( "header" ).height();
    var scrollTop = window.pageYOffset;
    var initialWidth = $( document ).outerWidth();
    $( flash ).css( { "margin-right": -initialWidth, top: ( scrollTop == 0 ? header_height : 0 )} )
    $( flash ).show();
    $( flash ).animate( { "margin-right": 0 } ,'fast' );
    var element = $( flash );
    setTimeout( function() {
        $( element ).animate( { "margin-right": -5000 } ,'fast' );
    }, 3000);
    setTimeout( function() {
        $( element ).parent().remove();
    }, 3200);
}

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}

var on_click_process = async ( event, callback = undefined ) => {
    event.preventDefault();
    var element = $( event.currentTarget )[ 0 ];
    var prefix  = $( element ).attr( "prefix" );
    var url     = $( element ).attr( "url" );
    chrome.storage.local.get( "token", async function( token ) {
        var token = ( !helpers.nullOrundefined( token.token ) && !helpers.isEmpty( token ) ) ? token.token : {};
        if ( !helpers.isEmpty( token ) ) {
            $( element ).attr( prefix + "token", token );
        }
        var data        = build_data_params( element.attributes, prefix );
        var response    = await helpers.make_post( url, data );
        if ( event.data.callback != undefined ) {
            var call = event.data.callback;
            window[ call ]( element, response );
        }
    } );
}

var build_data_params = ( attributes, prefix ) => {
    var regex = new RegExp( prefix );
    var data = new FormData();
    $.each( attributes, function() {
        // https://stackoverflow.com/questions/14645806/get-all-attributes-of-an-element-using-jquery
        if( this.specified && this.name.match( regex ) ) {
            data.append( this.name.replace( regex, "" ), this.value );
        }
    } );
    return data;
}

var store_alert_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now active!", "success" );
        } else {
            var color = "#6c757d";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now inactive.", "info" );
        }
        $( element ).css( { color: color } );
    } else {
        print_flash( "Make sure you are logged int at couponifier.com first", "error" );
    }
}

var store_follow_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "You are now following " + $( element ).attr( "stor_name" ), "success" );
        } else {
            var color = "#6c757d";
            print_flash( "You are no longer following " + $( element ).attr( "stor_name" ), "info" );
        }
        $( element ).css( { color: color } );
    } else {
        print_flash( "Make sure you are logged int at couponifier.com first", "error" );
    }
}