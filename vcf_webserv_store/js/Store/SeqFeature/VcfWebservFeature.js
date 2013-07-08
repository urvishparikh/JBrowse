/**
 * User: urvishparikh
 * Date: 7/3/13
 * Time: 11:04 AM
 * To change this template use File | Settings | File Templates.
 */


define(['JBrowse/Util',
        'JBrowse/Model/SimpleFeature'
        ],
       function (Util, SimpleFeature) {
           var vcf_webserv_feature = Util.fastDeclare({
                    constructor: function(args){
                        args = args || {};
                        this.data = args.data;
                        this._parent = args.parent || {};
                        this._uniqueID = args.id || this.data.uniqueID;

                        var subfeatures;
                        if (subfeatures = this.data.subfeatures){
                            for( var i = 0; i < subfeatures.length; i++ ) {
                                if( typeof subfeatures[i].get != 'function' ) {
                                    subfeatures[i] = new SimpleFeature(
                                        { data: subfeatures[i],
                                           parent: this
                                        });
                                }
                            }
                        }
                    },
                    get: function( field) {
                        return this._get( field ) || this._get( field.toLowerCase() );
                    },

                    // same as get(), except requires lower-case arguments.  used
                    // internally to save lots of calls to field.toLowerCase()
                    _get: function( field ) {
                        return field in this.data ? this.data[field] : // have we already parsed it out?
                            function(field) {
                                var v = this.data[field] =
                                    this['_parse_'+field] ? this['_parse_'+field]()            : // maybe we have a special parser for it
                                                            undefined;
                                return v;
                            }.call(this,field);
                    },
                    tags: function(){
                        var t = []
                        var d = this.data
                        for (var k in d){
                            if (d.hasOwnProperty(k))
                                t.push(k);

                            }
                        return t
                    },

                    id: function(){
                      return this._uniqueID
                    },
                    parent: function()
                    {
                      return this._parent
                    },
                    children: function(){
                        this.get('subfeatures');

                    },
               //TODO: BUILD PARSERS LIKE BELOW
                    _parse_genotypes: function() {
                        var fields = this.fields;
                        var parser = this.parser;
                        delete this.fields; // TODO: remove these deletes if we add other laziness
                        delete this.parser;

                        if( fields.length < 10 )
                            return null;

                        // parse the genotype data fields
                        var genotypes = [];
                        var format = array.map( fields[8].split(':'), function( fieldID ) {
                                         return { id: fieldID, meta: parser._getFormatMeta( fieldID ) };
                                     }, this );
                        for( var i = 9; i < fields.length; ++i ) {
                            var g = (fields[i]||'').split(':');
                            var gdata = {};
                            for( var j = 0; j<format.length; ++j ) {
                                var gData = g[j] || '';
                                gdata[ format[j].id ] = {
                                    // don't split on commas if it looks like a string
                                    values: gData.charAt(0) == '"' ? [ gData ] : gData.split(','),
                                    meta: format[j].meta
                                };
                            }
                            genotypes.push( gdata );
                        }

                        // index the genotypes by sample ID
                        var bySample = {};
                        for( var i = 0; i<genotypes.length; i++ ) {
                            var sname = (parser.header.samples||{})[i];
                            if( sname ) {
                                bySample[sname] = genotypes[i];
                            }
                        }

                        // add a toString to it that serializes it to JSON without its metadata
                        bySample.toString = this._stringifySample;

                        return bySample;
                    },

                    _stringifySample: function() {
                        var ex = {};
                        for( var sample in this ) {
                            var srec = ex[sample] = {};
                            for( var field in this[sample] ) {
                                    srec[field] = this[sample][field].values;
                            }
                        }
                        return (JSON||dojoJSON).stringify( ex );
                    }

                });
           return vcf_webserv_feature
       });